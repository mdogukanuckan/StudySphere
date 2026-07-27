import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { UserAchievement } from './entities/user-achievement.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { Friendship } from '../friends/entities/friendship.entity';
import { StudyRoom } from '../study-room/entities/study-room.entity';
import { UserStatisticsModule } from '../user-statistics/user-statistics.module';

@Module({
  imports: [

    TypeOrmModule.forFeature([UserAchievement, StudySession, Friendship, StudyRoom]),

    UserStatisticsModule,
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
