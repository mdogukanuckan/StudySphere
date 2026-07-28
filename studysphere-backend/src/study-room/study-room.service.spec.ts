import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { StudyRoomService } from './study-room.service';
import { StudyRoom } from './entities/study-room.entity';
import { RoomParticipant } from './entities/room-participant.entity';
import { StudyRoomGateway } from './study-room.gateway';
import { StudySession } from '../study-sessions/entities/study-session.entity';

describe('StudyRoomService', () => {
  let service: StudyRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyRoomService,
        { provide: getRepositoryToken(StudyRoom), useValue: {} },
        { provide: getRepositoryToken(RoomParticipant), useValue: {} },
        { provide: getRepositoryToken(StudySession), useValue: {} },
        { provide: getDataSourceToken(), useValue: {} },
        { provide: StudyRoomGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<StudyRoomService>(StudyRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
