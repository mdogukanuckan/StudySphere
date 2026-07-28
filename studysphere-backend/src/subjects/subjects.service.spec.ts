import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
import { Universe } from '../universes/entities/universe.entity';
import { UserUniverse } from '../universes/entities/user-universe.entity';

describe('SubjectsService', () => {
  let service: SubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: getRepositoryToken(Subject), useValue: {} },
        { provide: getRepositoryToken(Universe), useValue: {} },
        { provide: getRepositoryToken(UserUniverse), useValue: {} },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
