import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { UserStatisticsService } from './user-statistics.service';
import { UserStatistic } from './entities/user-statistic.entity';
import { StudySessionsService } from '../study-sessions/study-sessions.service';

describe('UserStatisticsService', () => {
  let service: UserStatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatisticsService,
        { provide: getRepositoryToken(UserStatistic), useValue: {} },
        { provide: getDataSourceToken(), useValue: {} },
        { provide: StudySessionsService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserStatisticsService>(UserStatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
