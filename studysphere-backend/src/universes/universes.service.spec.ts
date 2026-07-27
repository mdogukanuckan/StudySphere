import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UniversesService } from './universes.service';
import { Universe } from './entities/universe.entity';
import { UserUniverse } from './entities/user-universe.entity';

describe('UniversesService', () => {
  let service: UniversesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversesService,
        { provide: getRepositoryToken(Universe), useValue: {} },
        { provide: getRepositoryToken(UserUniverse), useValue: {} },
      ],
    }).compile();

    service = module.get<UniversesService>(UniversesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
