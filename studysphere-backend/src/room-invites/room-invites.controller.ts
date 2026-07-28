import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RoomInvitesService } from './room-invites.service';
import { CreateRoomInviteDto } from './dto/create-room-invite.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class RoomInvitesController {
  constructor(private readonly roomInvitesService: RoomInvitesService) {}

  @Post('study-rooms/:id/invites')
  async sendInvite(@Req() req, @Param('id') roomId: string, @Body() dto: CreateRoomInviteDto) {
    return await this.roomInvitesService.sendInvite(req.user.userId, roomId, dto.friendUserId);
  }

  @Get('room-invites/me')
  async getMyInvites(@Req() req) {
    return await this.roomInvitesService.getMyInvites(req.user.userId);
  }

  @Post('room-invites/:id/accept')
  @UseGuards(EmailVerifiedGuard)
  async acceptInvite(@Req() req, @Param('id') inviteId: string) {
    await this.roomInvitesService.acceptInvite(req.user.userId, inviteId);
    return { message: 'Davet kabul edildi, odaya katıldınız.' };
  }

  @Post('room-invites/:id/decline')
  async declineInvite(@Req() req, @Param('id') inviteId: string) {
    await this.roomInvitesService.declineInvite(req.user.userId, inviteId);
    return { message: 'Davet reddedildi.' };
  }
}
