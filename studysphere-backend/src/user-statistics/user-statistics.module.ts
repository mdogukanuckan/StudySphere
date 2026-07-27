import { forwardRef, Module } from '@nestjs/common';
import { UserStatisticsService } from './user-statistics.service';
import { UserStatisticsController } from './user-statistics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStatistic } from './entities/user-statistic.entity';
import { StudySessionsModule } from '../study-sessions/study-sessions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserStatistic]),
    forwardRef(() => StudySessionsModule), 
  ],
  providers: [UserStatisticsService],
  controllers: [UserStatisticsController],
  exports: [UserStatisticsService],
})
export class UserStatisticsModule {}