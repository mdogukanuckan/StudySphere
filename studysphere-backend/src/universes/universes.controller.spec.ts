import { Test, TestingModule } from '@nestjs/testing';
import { UniversesController } from './universes.controller';
import { UniversesService } from './universes.service';

describe('UniversesController', () => {
  let controller: UniversesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UniversesController],
      providers: [
        { provide: UniversesService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UniversesController>(UniversesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
