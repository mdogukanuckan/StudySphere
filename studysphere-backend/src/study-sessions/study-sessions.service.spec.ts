import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudySessionsService } from './study-sessions.service';
import { StudySession } from './entities/study-session.entity';
import { Topic } from '../topics/entities/topic.entity';
import { RoomParticipant } from '../study-room/entities/room-participant.entity';
import { UserStatisticsService } from '../user-statistics/user-statistics.service';
import { StudyRoomGateway } from '../study-room/study-room.gateway';

describe('StudySessionsService', () => {
  let service: StudySessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudySessionsService,
        // Üç repository, UserStatisticsService (istatistik güncellemek için)
        // ve artık StudyRoomGateway (kronometre duraklat/devam yayınları için)
        // constructor'da bekleniyordu; hiçbiri sağlanmadan compile() hiç
        // başarılı olmuyordu.
        { provide: getRepositoryToken(StudySession), useValue: {} },
        { provide: getRepositoryToken(Topic), useValue: {} },
        { provide: getRepositoryToken(RoomParticipant), useValue: {} },
        { provide: UserStatisticsService, useValue: {} },
        { provide: StudyRoomGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<StudySessionsService>(StudySessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
