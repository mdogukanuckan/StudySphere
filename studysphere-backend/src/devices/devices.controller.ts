import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { DevicesService } from './devices.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @UseGuards(JwtAuthGuard)
    @Patch('push-token')
    async registerPushToken(@Req() req, @Body() dto: RegisterPushTokenDto) {
        await this.devicesService.registerPushToken(req.user.userId, dto.deviceId, dto.token);
        return { message: 'ok' };
    }
}
