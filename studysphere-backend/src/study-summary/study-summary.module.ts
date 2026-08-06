import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { MailModule } from '../mail/mail.module';
import { StudySessionsModule } from '../study-sessions/study-sessions.module';
import { StudySummaryService } from './study-summary.service';
import { StudySummaryController } from './study-summary.controller';
import { StudySummaryPdfService } from './study-summary-pdf.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, StudySession]),
        MailModule,
        StudySessionsModule,
    ],
    controllers: [StudySummaryController],
    providers: [StudySummaryService, StudySummaryPdfService],
})
export class StudySummaryModule { }
