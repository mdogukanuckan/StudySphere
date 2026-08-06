import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { StudySession, SessionStatus } from '../study-sessions/entities/study-session.entity';
import { StudySessionsService } from '../study-sessions/study-sessions.service';
import { MailService } from '../mail/mail.service';
import { StudySummaryPdfService } from './study-summary-pdf.service';

const TURKEY_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

type SummaryPeriod = 'weekly' | 'monthly';

interface PeriodRange {
    start: Date;
    end: Date;
    periodLabel: string;
}

export interface TestSummaryResult {
    period: SummaryPeriod;
    periodLabel: string;
    sessionCount: number;
    hasData: boolean;
    sentTo: string;
}

const REPORT_TITLES: Record<SummaryPeriod, string> = {
    weekly: 'Haftalık Çalışma Özeti',
    monthly: 'Aylık Çalışma Özeti',
};

const REPORT_FILE_NAMES: Record<SummaryPeriod, string> = {
    weekly: 'studysphere-haftalik-ozet.pdf',
    monthly: 'studysphere-aylik-ozet.pdf',
};

@Injectable()
export class StudySummaryService {
    private readonly logger = new Logger(StudySummaryService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(StudySession)
        private readonly studySessionRepository: Repository<StudySession>,
        private readonly studySessionsService: StudySessionsService,
        private readonly mailService: MailService,
        private readonly studySummaryPdfService: StudySummaryPdfService,
    ) { }

    private getTurkeyDateParts(date: Date): { year: number; month: number; day: number } {
        const shifted = new Date(date.getTime() + TURKEY_UTC_OFFSET_MS);
        return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
    }

    private turkeyMidnightUtc(year: number, month: number, day: number): Date {
        return new Date(Date.UTC(year, month, day) - TURKEY_UTC_OFFSET_MS);
    }

    @Cron('0 8 * * 1', { timeZone: 'Europe/Istanbul' })
    async sendWeeklySummaries() {
        const { start, end, periodLabel } = this.computeWeeklyRange();
        await this.sendSummariesForPeriod('weekly', start, end, periodLabel);
    }

    @Cron('0 9 1 * *', { timeZone: 'Europe/Istanbul' })
    async sendMonthlySummaries() {
        const { start, end, periodLabel } = this.computeMonthlyRange();
        await this.sendSummariesForPeriod('monthly', start, end, periodLabel);
    }

    private computeWeeklyRange(): PeriodRange {
        const now = new Date();
        const { year, month, day } = this.getTurkeyDateParts(now);
        const end = this.turkeyMidnightUtc(year, month, day);
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        const periodLabel = `${this.formatDate(start)} - ${this.formatDate(new Date(end.getTime() - 1))}`;
        return { start, end, periodLabel };
    }

    private computeMonthlyRange(): PeriodRange {
        const now = new Date();
        const { year, month } = this.getTurkeyDateParts(now);
        const end = this.turkeyMidnightUtc(year, month, 1);
        const start = this.turkeyMidnightUtc(year, month - 1, 1);
        const periodLabel = start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
        return { start, end, periodLabel };
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' });
    }

    private async getPeriodTotals(userId: string, start: Date, end: Date) {
        return await this.studySessionRepository
            .createQueryBuilder('s')
            .select('COUNT(*)', 'sessionCount')
            .addSelect('COALESCE(SUM(s.duration_seconds), 0)', 'totalDuration')
            .addSelect('COALESCE(SUM(s.question_count), 0)', 'questionCount')
            .addSelect('COALESCE(SUM(s.correct_count), 0)', 'correctCount')
            .addSelect('COALESCE(SUM(s.wrong_count), 0)', 'wrongCount')
            .addSelect('COUNT(DISTINCT DATE(s.start_time))', 'daysStudied')
            .where('s.user_id = :userId', { userId })
            .andWhere('s.session_status = :status', { status: SessionStatus.FINISHED })
            .andWhere('s.start_time >= :start', { start })
            .andWhere('s.start_time < :end', { end })
            .getRawOne();
    }

    private async buildAndSendSummary(
        period: SummaryPeriod,
        user: User,
        start: Date,
        end: Date,
        periodLabel: string,
        options: { skipIfEmpty: boolean },
    ): Promise<{ sessionCount: number; sent: boolean }> {
        const raw = await this.getPeriodTotals(user.id, start, end);
        const sessionCount = parseInt(raw?.sessionCount ?? '0', 10);

        if (sessionCount === 0 && options.skipIfEmpty) {
            return { sessionCount, sent: false };
        }

        const subjectBreakdown = await this.studySessionsService.getSubjectPerformance(user.id, { start, end });

        const summaryData = {
            periodLabel,
            totalDurationSeconds: parseInt(raw?.totalDuration ?? '0', 10),
            sessionCount,
            daysStudied: parseInt(raw?.daysStudied ?? '0', 10),
            questionCount: parseInt(raw?.questionCount ?? '0', 10),
            correctCount: parseInt(raw?.correctCount ?? '0', 10),
            wrongCount: parseInt(raw?.wrongCount ?? '0', 10),
        };

        const pdfBuffer = await this.studySummaryPdfService.generate({
            ...summaryData,
            userName: user.username,
            reportTitle: REPORT_TITLES[period],
            subjectBreakdown,
        });

        await this.mailService.sendStudySummary(user.email, summaryData, {
            name: REPORT_FILE_NAMES[period],
            content: pdfBuffer,
        });

        return { sessionCount, sent: true };
    }

    private async sendSummariesForPeriod(period: SummaryPeriod, start: Date, end: Date, periodLabel: string) {
        const column = period === 'weekly' ? 'weekly_summary_email_enabled' : 'monthly_summary_email_enabled';

        const users = await this.userRepository
            .createQueryBuilder('u')
            .where(`u.${column} = true`)
            .andWhere('u.is_email_verified = true')
            .getMany();

        this.logger.log(`${period} çalışma özeti gönderimi başlıyor: ${users.length} kullanıcı, dönem: ${periodLabel}`);

        for (const user of users) {
            try {
                await this.buildAndSendSummary(period, user, start, end, periodLabel, { skipIfEmpty: true });
            } catch (error) {
                this.logger.warn(`${period} özet e-postası gönderilemedi (${user.email}): ${(error as Error)?.message}`);
            }
        }
    }

    async sendTestSummary(userId: string, period: SummaryPeriod): Promise<TestSummaryResult> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const { start, end, periodLabel } = period === 'weekly'
            ? this.computeWeeklyRange()
            : this.computeMonthlyRange();

        const { sessionCount } = await this.buildAndSendSummary(period, user, start, end, periodLabel, { skipIfEmpty: false });

        return {
            period,
            periodLabel,
            sessionCount,
            hasData: sessionCount > 0,
            sentTo: user.email,
        };
    }
}
