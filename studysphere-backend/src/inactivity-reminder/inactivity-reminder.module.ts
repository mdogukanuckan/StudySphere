import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { PushModule } from '../push/push.module';
import { DevicesModule } from '../devices/devices.module';
import { InactivityReminderService } from './inactivity-reminder.service';
import { InactivityReminderController } from './inactivity-reminder.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        MailModule,
        PushModule,
        DevicesModule,
    ],
    controllers: [InactivityReminderController],
    providers: [InactivityReminderService],
})
export class InactivityReminderModule { }
