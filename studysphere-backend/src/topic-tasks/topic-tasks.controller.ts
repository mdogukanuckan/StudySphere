import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { TopicTasksService } from './topic-tasks.service';
import { CreateTopicTaskDto } from './dto/create-topic-task.dto';
import { UpdateTopicTaskDto } from './dto/update-topic-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

// Diğer alt-kaynaklarla (topics: ?subjectId=) aynı düz (flat) REST deseni:
// nested /topics/:id/tasks yerine ?topicId= sorgu parametresi.
//
// '/topic-tasks/my' ve '/topic-tasks/my-overview' literal alt yollar olduğu
// için '/topic-tasks' (findAll) ile hiçbir zaman çakışmıyor.
@Controller('topic-tasks')
@UseGuards(JwtAuthGuard)
export class TopicTasksController {
  constructor(private readonly topicTasksService: TopicTasksService) {}

  @Post()
  create(@Req() req, @Body() createTopicTaskDto: CreateTopicTaskDto) {
    return this.topicTasksService.create(createTopicTaskDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req, @Query('topicId') topicId: string) {
    return this.topicTasksService.findAll(topicId, req.user.userId);
  }

  // "Görevlerim" ekranının "Notlar" sekmesi için.
  @Get('my-overview')
  getMyOverview(@Req() req) {
    return this.topicTasksService.getMyOverview(req.user.userId);
  }

  // "Görevlerim" ekranının "Görevler" sekmesi için: kullanıcının sahip
  // olduğu tüm konulardaki tüm görevler, tek bir düz listede.
  @Get('my')
  getMyTasks(@Req() req) {
    return this.topicTasksService.getMyTasks(req.user.userId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateTopicTaskDto: UpdateTopicTaskDto) {
    return this.topicTasksService.update(id, updateTopicTaskDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.topicTasksService.remove(id, req.user.userId);
  }
}
