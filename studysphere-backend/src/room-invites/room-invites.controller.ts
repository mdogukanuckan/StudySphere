import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RoomInvitesService } from './room-invites.service';
import { CreateRoomInviteDto } from './dto/create-room-invite.dto';

// Sınıf seviyesinde ortak bir prefix yok — rotalar hem study-room.controller.ts
// (aynı 'study-rooms' base'i) hem de kendi 'room-invites' alanıyla iç içe.
// Nest'te bu, farklı controller sınıflarında olsalar bile path segment'leri
// çakışmadığı sürece sorunsuz çalışır (bkz. study-room.module.ts ile bu
// modül arasındaki döngüsel bağımlılık riskini almamak için ayrı controller
// tercih edildi).
@Controller()
@UseGuards(JwtAuthGuard)
export class RoomInvitesController {
  constructor(private readonly roomInvitesService: RoomInvitesService) {}

  // Bir çalışma odasındaki aktif bir katılımcının, ACCEPTED arkadaşına o
  // odaya davet göndermesi. Davet gönderen zaten odaya girerken doğrulanmış
  // olmak zorunda kaldığı için (createRoom/joinRoom EmailVerifiedGuard'lı)
  // burada ayrıca guard eklenmedi.
  @Post('study-rooms/:id/invites')
  async sendInvite(@Req() req, @Param('id') roomId: string, @Body() dto: CreateRoomInviteDto) {
    return await this.roomInvitesService.sendInvite(req.user.userId, roomId, dto.friendUserId);
  }

  @Get('room-invites/me')
  async getMyInvites(@Req() req) {
    return await this.roomInvitesService.getMyInvites(req.user.userId);
  }

  // Davet kabul etmek bir odaya katılmak demek — normal katılma (:id/join)
  // ile aynı kural: doğrulanmamış e-posta ile kabul edilemez.
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
