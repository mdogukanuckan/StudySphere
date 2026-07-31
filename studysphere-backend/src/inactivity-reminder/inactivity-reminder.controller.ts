import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { InactivityReminderService } from './inactivity-reminder.service';
import { TestSendInactivityReminderDto } from './dto/test-send-inactivity-reminder.dto';

@Controller('inactivity-reminder')
export class InactivityReminderController {
    constructor(private readonly inactivityReminderService: InactivityReminderService) { }

    @UseGuards(JwtAuthGuard)
    @Post('test-send')
    async testSend(@Req() req, @Body() dto: TestSendInactivityReminderDto) {
        return this.inactivityReminderService.sendTestReminder(req.user.userId, dto.stage ?? 1);
    }
}
