import { forwardRef, Module } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsController } from './study-sessions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudySession } from './entities/study-session.entity';
import { Topic } from '../topics/entities/topic.entity';
import { RoomParticipant } from '../study-room/entities/room-participant.entity';
import { UserStatisticsModule } from '../user-statistics/user-statistics.module';
import { StudyRoomsModule } from '../study-room/study-room.module';
import { AchievementsModule } from '../achievements/achievements.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([StudySession, Topic, RoomParticipant]),
    forwardRef(() => UserStatisticsModule),
    StudyRoomsModule,
    AchievementsModule,
  ],
  providers: [StudySessionsService],
  controllers: [StudySessionsController],
  exports: [StudySessionsService],
})
export class StudySessionsModule {}