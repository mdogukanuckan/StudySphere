import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicTask } from './entities/topic-task.entity';
import { CreateTopicTaskDto } from './dto/create-topic-task.dto';
import { UpdateTopicTaskDto } from './dto/update-topic-task.dto';
import { TopicsService } from '../topics/topics.service';

export interface TopicTaskOverviewItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  notes: string | null;
  taskCount: number;
  completedCount: number;
  lastActivityAt: string;
}

export interface TopicTaskWithContext {
  id: string;
  title: string;
  isCompleted: boolean;
  notes: string | null;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TopicTasksService {

  constructor(
    @InjectRepository(TopicTask)
    private readonly topicTaskRepository: Repository<TopicTask>,
    private readonly topicsService: TopicsService,
  ) {}

  async create(createTopicTaskDto: CreateTopicTaskDto, userId: string): Promise<TopicTask> {
    const { title, topicId, notes } = createTopicTaskDto;
    const topic = await this.topicsService.findOne(topicId, userId);

    const newTask = this.topicTaskRepository.create({ title, topicId: topic.id, notes: notes ?? null });
    return await this.topicTaskRepository.save(newTask);
  }

  async findAll(topicId: string, userId: string): Promise<TopicTask[]> {
    await this.topicsService.findOne(topicId, userId);
    return await this.topicTaskRepository.find({
      where: { topicId },
      order: { createdAt: 'ASC' },
    });
  }

  private async findOwnedTask(id: string, userId: string): Promise<TopicTask> {
    const task = await this.topicTaskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Aradığınız görev bulunamadı.');
    }
    await this.topicsService.findOne(task.topicId, userId);
    return task;
  }

  async update(id: string, updateTopicTaskDto: UpdateTopicTaskDto, userId: string): Promise<TopicTask> {
    const task = await this.findOwnedTask(id, userId);
    Object.assign(task, updateTopicTaskDto);
    return await this.topicTaskRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOwnedTask(id, userId);
    await this.topicTaskRepository.remove(task);
  }

  async getMyOverview(userId: string): Promise<TopicTaskOverviewItem[]> {
    const rows = await this.topicTaskRepository.manager
      .createQueryBuilder()
      .select('t.id', 'topicId')
      .addSelect('t.name', 'topicName')
      .addSelect('t.notes', 'notes')
      .addSelect('s.id', 'subjectId')
      .addSelect('s.name', 'subjectName')
      .addSelect('COUNT(tt.id)', 'taskCount')
      .addSelect('COUNT(tt.id) FILTER (WHERE tt.is_completed = true)', 'completedCount')
      .addSelect('GREATEST(t.updated_at, COALESCE(MAX(tt.updated_at), t.updated_at))', 'lastActivityAt')
      .from('topics', 't')
      .innerJoin('subjects', 's', 's.id = t.subject_id')
      .innerJoin('user_universes', 'uu', 'uu.universe_id = s.universe_id AND uu.user_id = :userId', { userId })
      .leftJoin('topic_tasks', 'tt', 'tt.topic_id = t.id')
      .groupBy('t.id')
      .addGroupBy('s.id')
      .having(`COUNT(tt.id) > 0 OR (t.notes IS NOT NULL AND t.notes <> '')`)
      .orderBy('"lastActivityAt"', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      topicId: r.topicId,
      topicName: r.topicName,
      subjectId: r.subjectId,
      subjectName: r.subjectName,
      notes: r.notes,
      taskCount: parseInt(r.taskCount, 10) || 0,
      completedCount: parseInt(r.completedCount, 10) || 0,
      lastActivityAt: r.lastActivityAt,
    }));
  }

  async getMyTasks(userId: string): Promise<TopicTaskWithContext[]> {
    const rows = await this.topicTaskRepository.manager
      .createQueryBuilder()
      .select('tt.id', 'id')
      .addSelect('tt.title', 'title')
      .addSelect('tt.is_completed', 'isCompleted')
      .addSelect('tt.notes', 'notes')
      .addSelect('tt.topic_id', 'topicId')
      .addSelect('tt.created_at', 'createdAt')
      .addSelect('tt.updated_at', 'updatedAt')
      .addSelect('t.name', 'topicName')
      .addSelect('s.id', 'subjectId')
      .addSelect('s.name', 'subjectName')
      .from('topic_tasks', 'tt')
      .innerJoin('topics', 't', 't.id = tt.topic_id')
      .innerJoin('subjects', 's', 's.id = t.subject_id')
      .innerJoin('user_universes', 'uu', 'uu.universe_id = s.universe_id AND uu.user_id = :userId', { userId })
      .orderBy('tt.is_completed', 'ASC')
      .addOrderBy('tt.created_at', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      isCompleted: r.isCompleted,
      notes: r.notes,
      topicId: r.topicId,
      topicName: r.topicName,
      subjectId: r.subjectId,
      subjectName: r.subjectName,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
