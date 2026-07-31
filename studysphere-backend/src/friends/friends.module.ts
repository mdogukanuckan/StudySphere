import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { AchievementsModule } from '../achievements/achievements.module';
import { UsersModule } from '../users/users.module';
import { UserStatisticsModule } from '../user-statistics/user-statistics.module';

@Module({

    imports: [
      TypeOrmModule.forFeature([Friendship, User, StudySession]),
      AchievementsModule,
      UsersModule,
      UserStatisticsModule,
    ],
    controllers: [FriendsController],
    providers: [FriendsService],
})
export class FriendsModule { }
