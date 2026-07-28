import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Topic } from './entities/topic.entity';
import { Repository } from 'typeorm';
import { Subject } from 'src/subjects/entities/subject.entity';
import { UserUniverse } from '../universes/entities/user-universe.entity';

@Injectable()
export class TopicsService {

  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository : Repository<Topic>,
    @InjectRepository(Subject)
    private readonly subjectRepository : Repository<Subject>,
    @InjectRepository(UserUniverse)
    private readonly userUniverseRepository : Repository<UserUniverse>,
  ){}

  private async verifySubjectOwnership(subjectId: string, userId: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException('Seçtiğiniz ders bulunamadı.');
    }
    const link = await this.userUniverseRepository.findOne({
      where: { universeId: subject.universeId, userId },
    });
    if (!link) {
      throw new NotFoundException('Seçtiğiniz ders bulunamadı.');
    }
    return subject;
  }

  async create(createTopicDto: CreateTopicDto, userId: string) {
   const {name, subjectId, notes} = createTopicDto;
   const subject = await this.verifySubjectOwnership(subjectId, userId);

   const existingTopic = await this.topicRepository.findOne({
    where : {name,subject : {id:subjectId}},
   });

   if(existingTopic){
    throw new ConflictException('Bu konu zaten bulunmakta.');
   }

   const newTopic = this.topicRepository.create({
    name,
    subject,
    notes: notes ?? null,
   })
    return await this.topicRepository.save(newTopic);
  }

  async findAll(userId: string, subjectId?: string) {
    if (subjectId) {
        await this.verifySubjectOwnership(subjectId, userId);
        return await this.topicRepository.find({
            where: { subjectId: subjectId }
        });
    }
    return await this.topicRepository
      .createQueryBuilder('topic')
      .innerJoin('subjects', 'subject', 'subject.id = topic.subject_id')
      .innerJoin('user_universes', 'uu', 'uu.universe_id = subject.universe_id')
      .where('uu.user_id = :userId', { userId })
      .getMany();
  }

  async findOne(id: string, userId: string) : Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where : {id},
      relations : {subject : true}
    });

    if(!topic){
      throw new NotFoundException('Aradığınız konu bulunamadı.');
    }
    await this.verifySubjectOwnership(topic.subjectId, userId);
    return topic;
  }

  async update(id: string, updateTopicDto: UpdateTopicDto, userId: string) : Promise<Topic>{
    const topic = await this.findOne(id, userId);
    Object.assign(topic,updateTopicDto);
    return await this.topicRepository.save(topic);
  }

  async remove(id: string, userId: string) : Promise<void>{
    const topic = await this.findOne(id, userId);
    try {
      await this.topicRepository.remove(topic);
    } catch (error: any) {
      if (error?.code === '23503' || error?.driverError?.code === '23503') {
        throw new ConflictException(
          'Bu konuyu silebilmek için önce ona ait çalışma seanslarını ve çalışma odalarını silmelisin.',
        );
      }
      throw error;
    }
  }
}
