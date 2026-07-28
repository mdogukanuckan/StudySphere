import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) { }

   
    @Get('search')
    search(@Req() req, @Query('query') query: string) {
        return this.friendsService.searchUsers(req.user.userId, query);
    }

    @Get()
    getFriends(@Req() req) {
        return this.friendsService.getFriends(req.user.userId);
    }

    @Get('requests')
    getPendingRequests(@Req() req) {
        return this.friendsService.getPendingRequests(req.user.userId);
    }

  
    @Get(':userId')
    getFriendProfile(@Req() req, @Param('userId') userId: string) {
        return this.friendsService.getFriendProfile(req.user.userId, userId);
    }

    @Post('requests')
    @UseGuards(EmailVerifiedGuard)
    sendRequest(@Req() req, @Body() dto: SendFriendRequestDto) {
        return this.friendsService.sendRequest(req.user.userId, dto.addresseeId);
    }

    @Post('requests/:id/accept')
    @UseGuards(EmailVerifiedGuard)
    acceptRequest(@Req() req, @Param('id') id: string) {
        return this.friendsService.acceptRequest(req.user.userId, id);
    }


    @Post('requests/:id/reject')
    async rejectRequest(@Req() req, @Param('id') id: string) {
        await this.friendsService.rejectOrCancelRequest(req.user.userId, id);
        return { message: 'İstek kaldırıldı.' };
    }

    @Delete(':userId')
    async removeFriend(@Req() req, @Param('userId') userId: string) {
        await this.friendsService.removeFriend(req.user.userId, userId);
        return { message: 'Arkadaşlıktan çıkarıldı.' };
    }
}
