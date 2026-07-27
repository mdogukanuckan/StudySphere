import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  create(@Req() req, @Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req, @Query('subjectId') subjectId?: string) {
    return this.topicsService.findAll(req.user.userId, subjectId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.topicsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.topicsService.remove(id, req.user.userId);
  }
}
