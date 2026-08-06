import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { StudySummaryService } from './study-summary.service';
import { TestSendStudySummaryDto } from './dto/test-send-study-summary.dto';

@Controller('study-summary')
export class StudySummaryController {
    constructor(private readonly studySummaryService: StudySummaryService) { }

    @UseGuards(JwtAuthGuard)
    @Post('send')
    async send(@Req() req, @Body() dto: TestSendStudySummaryDto) {
        return this.studySummaryService.sendTestSummary(req.user.userId, dto.period ?? 'weekly');
    }
}
