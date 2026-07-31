import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { PushService } from '../push/push.service';
import { DevicesService } from '../devices/devices.service';

interface ReminderStageDefinition {
    stage: number;
    days: number;
}

const REMINDER_STAGES: ReminderStageDefinition[] = [
    { stage: 1, days: 3 },
    { stage: 2, days: 7 },
    { stage: 3, days: 14 },
];

export interface TestReminderResult {
    stage: number;
    days: number;
    emailAttempted: boolean;
    emailSent: boolean;
    emailSkipReason?: string;
    pushTokenCount: number;
    pushAttempted: boolean;
}

@Injectable()
export class InactivityReminderService {
    private readonly logger = new Logger(InactivityReminderService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly mailService: MailService,
        private readonly pushService: PushService,
        private readonly devicesService: DevicesService,
    ) { }

    @Cron('0 10 * * *', { timeZone: 'Europe/Istanbul' })
    async checkInactiveUsers(): Promise<void> {
        const users = await this.userRepository
            .createQueryBuilder('u')
            .where('u.inactivity_reminder_enabled = true')
            .andWhere('u.last_active_at IS NOT NULL')
            .getMany();

        this.logger.log(`Hareketsizlik kontrolü başlıyor: ${users.length} kullanıcı taranıyor.`);

        for (const user of users) {
            try {
                await this.evaluateUser(user);
            } catch (error) {
                this.logger.warn(`Hareketsizlik değerlendirmesi başarısız (${user.email}): ${(error as Error)?.message}`);
            }
        }
    }

    private daysSinceActive(lastActiveAt: Date): number {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last = new Date(lastActiveAt);
        const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        return Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    }

    private buildPushMessage(days: number): { title: string; body: string } {
        if (days >= 14) {
            return {
                title: 'Seni özledik! 📚',
                body: "14 gündür StudySphere'e girmedin. Hemen geri dön!",
            };
        }
        if (days >= 7) {
            return {
                title: 'Bir haftadır yoksun 👀',
                body: '7 gündür çalışma kaydın yok. Kısa bir seansla devam etmeye ne dersin?',
            };
        }
        return {
            title: 'Hatırlatma 🔔',
            body: "3 gündür StudySphere'e uğramadın, çalışmalarına devam etmeyi unutma!",
        };
    }

    private async evaluateUser(user: User): Promise<void> {
        const daysInactive = this.daysSinceActive(user.lastActiveAt);

        const applicableStage = [...REMINDER_STAGES]
            .reverse()
            .find((definition) => daysInactive >= definition.days);

        if (!applicableStage || user.inactivityReminderStage >= applicableStage.stage) {
            return;
        }

        if (user.isEmailVerified) {
            try {
                await this.mailService.sendInactivityReminder(user.email, applicableStage.days);
            } catch (error) {
                this.logger.warn(`Hareketsizlik e-postası gönderilemedi (${user.email}): ${(error as Error)?.message}`);
            }
        }

        try {
            const tokens = await this.devicesService.getPushTokensForUser(user.id);
            if (tokens.length > 0) {
                const { title, body } = this.buildPushMessage(applicableStage.days);
                await this.pushService.sendToTokens(tokens, title, body);
            }
        } catch (error) {
            this.logger.warn(`Hareketsizlik push bildirimi gönderilemedi (${user.email}): ${(error as Error)?.message}`);
        }

        await this.userRepository.update(user.id, { inactivityReminderStage: applicableStage.stage });
    }

    async sendTestReminder(userId: string, stage: number): Promise<TestReminderResult> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const definition = REMINDER_STAGES.find((s) => s.stage === stage) ?? REMINDER_STAGES[0];

        let emailAttempted = false;
        let emailSent = false;
        let emailSkipReason: string | undefined;

        if (user.isEmailVerified) {
            emailAttempted = true;
            try {
                await this.mailService.sendInactivityReminder(user.email, definition.days);
                emailSent = true;
            } catch (error) {
                emailSkipReason = (error as Error)?.message ?? 'Bilinmeyen hata';
            }
        } else {
            emailSkipReason = 'E-posta doğrulanmamış, üretim mantığıyla aynı şekilde atlandı.';
        }

        const tokens = await this.devicesService.getPushTokensForUser(user.id);
        const pushAttempted = tokens.length > 0;
        if (pushAttempted) {
            const { title, body } = this.buildPushMessage(definition.days);
            await this.pushService.sendToTokens(tokens, title, body);
        }

        return {
            stage: definition.stage,
            days: definition.days,
            emailAttempted,
            emailSent,
            emailSkipReason,
            pushTokenCount: tokens.length,
            pushAttempted,
        };
    }
}
