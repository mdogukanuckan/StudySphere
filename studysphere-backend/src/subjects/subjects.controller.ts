import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(@Req() req, @Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req, @Query('universeId') universeId?: string) {
    return this.subjectsService.findAll(req.user.userId, universeId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.subjectsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.subjectsService.remove(id, req.user.userId);
  }
}
