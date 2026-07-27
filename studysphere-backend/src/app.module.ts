import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { UniversesModule } from './universes/universes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { UserStatisticsModule } from './user-statistics/user-statistics.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { StudyRoomsModule } from './study-room/study-room.module';
import { TopicTasksModule } from './topic-tasks/topic-tasks.module';
import { AchievementsModule } from './achievements/achievements.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl : 60000,
      limit : 10
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports : [ConfigModule],
      inject : [ConfigService],
      useFactory : (configService : ConfigService) => ({
        type :'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true 
      })
    }),
    UsersModule,
    UniversesModule,
    SubjectsModule,
    TopicsModule,
    StudySessionsModule,
    UserStatisticsModule,
    RefreshTokensModule,
    AuthModule,
    StudyRoomsModule,
    TopicTasksModule,
    AchievementsModule,
    FriendsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide : APP_GUARD,
      useClass : ThrottlerGuard
    }
  ],
})
export class AppModule {}
