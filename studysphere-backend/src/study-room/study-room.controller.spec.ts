import { Test, TestingModule } from '@nestjs/testing';
import { StudyRoomsController } from './study-room.controller';
import { StudyRoomService } from './study-room.service';

describe('StudyRoomsController', () => {
  let controller: StudyRoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyRoomsController],
      providers: [
        { provide: StudyRoomService, useValue: {} },
      ],
    }).compile();

    controller = module.get<StudyRoomsController>(StudyRoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
