import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { UserStatistic } from '../user-statistics/entities/user-statistic.entity';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  
    imports: [TypeOrmModule.forFeature([Friendship, User, StudySession, UserStatistic]), AchievementsModule],
    controllers: [FriendsController],
    providers: [FriendsService],
})
export class FriendsModule { }
