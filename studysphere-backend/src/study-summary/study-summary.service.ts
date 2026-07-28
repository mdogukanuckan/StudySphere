import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { StudySession, SessionStatus } from '../study-sessions/entities/study-session.entity';
import { MailService } from '../mail/mail.service';

const TURKEY_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

type SummaryPeriod = 'weekly' | 'monthly';

@Injectable()
export class StudySummaryService {
    private readonly logger = new Logger(StudySummaryService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(StudySession)
        private readonly studySessionRepository: Repository<StudySession>,
        private readonly mailService: MailService,
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
        const now = new Date();
        const { year, month, day } = this.getTurkeyDateParts(now);
        const end = this.turkeyMidnightUtc(year, month, day);
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

        const periodLabel = `${this.formatDate(start)} - ${this.formatDate(new Date(end.getTime() - 1))}`;
        await this.sendSummariesForPeriod('weekly', start, end, periodLabel);
    }

    @Cron('0 9 1 * *', { timeZone: 'Europe/Istanbul' })
    async sendMonthlySummaries() {
        const now = new Date();
        const { year, month } = this.getTurkeyDateParts(now);
        const end = this.turkeyMidnightUtc(year, month, 1);
        const start = this.turkeyMidnightUtc(year, month - 1, 1);

        const periodLabel = start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
        await this.sendSummariesForPeriod('monthly', start, end, periodLabel);
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' });
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
                const raw = await this.studySessionRepository
                    .createQueryBuilder('s')
                    .select('COUNT(*)', 'sessionCount')
                    .addSelect('COALESCE(SUM(s.duration_seconds), 0)', 'totalDuration')
                    .addSelect('COALESCE(SUM(s.question_count), 0)', 'questionCount')
                    .addSelect('COALESCE(SUM(s.correct_count), 0)', 'correctCount')
                    .addSelect('COALESCE(SUM(s.wrong_count), 0)', 'wrongCount')
                    .addSelect('COUNT(DISTINCT DATE(s.start_time))', 'daysStudied')
                    .where('s.user_id = :userId', { userId: user.id })
                    .andWhere('s.session_status = :status', { status: SessionStatus.FINISHED })
                    .andWhere('s.start_time >= :start', { start })
                    .andWhere('s.start_time < :end', { end })
                    .getRawOne();

                const sessionCount = parseInt(raw?.sessionCount ?? '0', 10);
                if (sessionCount === 0) {
                    continue;
                }

                await this.mailService.sendStudySummary(user.email, {
                    periodLabel,
                    totalDurationSeconds: parseInt(raw?.totalDuration ?? '0', 10),
                    sessionCount,
                    daysStudied: parseInt(raw?.daysStudied ?? '0', 10),
                    questionCount: parseInt(raw?.questionCount ?? '0', 10),
                    correctCount: parseInt(raw?.correctCount ?? '0', 10),
                    wrongCount: parseInt(raw?.wrongCount ?? '0', 10),
                });
            } catch (error) {
                this.logger.warn(`${period} özet e-postası gönderilemedi (${user.email}): ${(error as Error)?.message}`);
            }
        }
    }
}
