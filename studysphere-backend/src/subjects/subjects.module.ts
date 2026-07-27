import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Universe } from '../universes/entities/universe.entity';
import { UserUniverse } from '../universes/entities/user-universe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject,Universe,UserUniverse])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule { }
