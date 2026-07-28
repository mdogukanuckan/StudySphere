import { Module } from '@nestjs/common';
import { UniversesService } from './universes.service';
import { UniversesController } from './universes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Universe } from './entities/universe.entity';
import { UserUniverse } from './entities/user-universe.entity';
import { Subject } from '../subjects/entities/subject.entity';

@Module({
  imports : [TypeOrmModule.forFeature([Universe,UserUniverse,Subject])],
  controllers: [UniversesController],
  providers: [UniversesService],
})
export class UniversesModule {}
