import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UniversesService } from './universes.service';
import { CreateUniverseDto } from './dto/create-universe.dto';
import { UpdateUniverseDto } from './dto/update-universe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('universes')
@UseGuards(JwtAuthGuard)
export class UniversesController {
  constructor(private readonly universesService: UniversesService) {}

  @Post()
  create(@Req() req, @Body() createUniverseDto: CreateUniverseDto) {
    return this.universesService.create(createUniverseDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req) {
    return this.universesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.universesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateUniverseDto: UpdateUniverseDto) {
    return this.universesService.update(id, updateUniverseDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.universesService.remove(id, req.user.userId);
  }
}
