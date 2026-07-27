import { Controller, Get, Delete, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokensService } from './refresh-tokens.service';

@Controller('refresh-tokens')
@UseGuards(AuthGuard('jwt'))
export class RefreshTokensController {
  constructor(private readonly refreshTokensService: RefreshTokensService) {}


  @Get('my-sessions')
  async getMySessions(@Req() req: any) {
    return this.refreshTokensService.findActiveSessionsForUser(req.user.userId);
  }


  @Delete(':id')
  async revokeSession(@Param('id') id: string, @Req() req: any) {
    const sessions = await this.refreshTokensService.findActiveSessionsForUser(req.user.userId);
    const owns = sessions.some((s) => s.id === id);
    if (!owns) {
      throw new ForbiddenException('Bu oturumu sonlandırma yetkiniz yok.');
    }
    await this.refreshTokensService.revoke(id);
    return { message: 'Oturum sonlandırıldı.' };
  }
}