import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserStatisticsService } from './user-statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('user-statistics')
@UseGuards(JwtAuthGuard)
export class UserStatisticsController {
  constructor(private readonly userStatisticsService: UserStatisticsService) {}

  @Get('daily-stats')
  async getDailyStats(@Req() req: any) {
    const userId = req.user.userId;
    return await this.userStatisticsService.getDailyStudyStats(userId);
  }

  @Get('me')
  async getMyStatistics(@Req() req: any) {
    const userId = req.user.userId;
    return await this.userStatisticsService.getStatisticByUserId(userId);
  }
}
