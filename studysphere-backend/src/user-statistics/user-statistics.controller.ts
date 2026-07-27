import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserStatisticsService } from './user-statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

// Not: bu controller'da daha once id ile calisan generic CRUD uclari
// (POST /, GET /, GET /:id, PATCH /:id, DELETE /:id) vardi ama arkalarindaki
// servis metotlari hic doldurulmamis NestJS iskelet koduydu (gercek DB
// islemi yapmiyordu) ve hicbir sahiplik/rol kontrolu icermiyordu. Gercekte
// kullanilmadiklari icin (uygulama hep asagidaki iki uc noktayi kullaniyor)
// kaldirildilar — ileride biri bu iskeleti sahiplik kontrolu eklemeden
// doldurursa gercek bir yetki acigina donusebilirdi.
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
