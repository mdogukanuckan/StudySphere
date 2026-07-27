import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicTasksService } from './topic-tasks.service';
import { TopicTasksController } from './topic-tasks.controller';
import { TopicTask } from './entities/topic-task.entity';
import { TopicsModule } from '../topics/topics.module';

@Module({
  imports: [TypeOrmModule.forFeature([TopicTask]), TopicsModule],
  controllers: [TopicTasksController],
  providers: [TopicTasksService],
})
export class TopicTasksModule {}
