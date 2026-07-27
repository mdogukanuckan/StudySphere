import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UserStatisticsService } from './user-statistics.service';
import { CreateUserStatisticDto } from './dto/create-user-statistic.dto';
import { UpdateUserStatisticDto } from './dto/update-user-statistic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('user-statistics')
@UseGuards(JwtAuthGuard)
export class UserStatisticsController {
  constructor(private readonly userStatisticsService: UserStatisticsService) {}

  @Get('daily-stats')
  @UseGuards(JwtAuthGuard) 
  async getDailyStats(@Req() req: any) {
    const userId = req.user.userId; 
    return await this.userStatisticsService.getDailyStudyStats(userId);
  }
  @Get('me')
  async getMyStatistics(@Req() req : any){
    const userId = req.user.userId;
    return await this.userStatisticsService.getStatisticByUserId(userId);
  }
  @Post()
  create(@Body() createUserStatisticDto: CreateUserStatisticDto) {
    return this.userStatisticsService.create(createUserStatisticDto);
  }

  @Get()
  findAll() {
    return this.userStatisticsService.findAll();
  }

  @Get(':id')
findOne(@Param('id') id: string) {
  return this.userStatisticsService.findOne(id);
}

@Patch(':id')
update(@Param('id') id: string, @Body() updateUserStatisticDto: UpdateUserStatisticDto) {
  return this.userStatisticsService.update(id, updateUserStatisticDto);
}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userStatisticsService.remove(id);
  }
}
