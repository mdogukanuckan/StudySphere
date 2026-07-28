import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { MailModule } from '../mail/mail.module';
import { StudySummaryService } from './study-summary.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, StudySession]),
        MailModule,
    ],
    providers: [StudySummaryService],
})
export class StudySummaryModule { }
