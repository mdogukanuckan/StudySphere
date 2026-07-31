import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { CreateStudyRoomDto } from './dto/create-study-room.dto';
import { UpdateStudyRoomDto } from './dto/update-study-room.dto';
import { RoomFilterDto } from './dto/room-filter.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { JoinByCodeDto } from './dto/join-by-code.dto';
import { UpdateParticipantStatusDto } from './dto/update-participant-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { StudyRoomService } from './study-room.service';


@Controller('study-rooms')
@UseGuards(JwtAuthGuard)
export class StudyRoomsController {
  constructor(private readonly studyRoomsService: StudyRoomService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  async createRoom(@Req() req, @Body() createStudyRoomDto: CreateStudyRoomDto) {
    return await this.studyRoomsService.createRoom(req.user.userId, createStudyRoomDto);
  }

  @Get()
  async getRooms(@Req() req, @Query() filterDto: RoomFilterDto) {
    return await this.studyRoomsService.getRooms(filterDto, req.user.userId);
  }

  @Get('search')
  async searchRooms(@Query() searchDto: SearchRoomsDto) {
    return await this.studyRoomsService.searchPublicRooms(searchDto.q);
  }

  @Get('search-suggestions')
  async getSearchSuggestions(@Query() searchDto: SearchRoomsDto) {
    return await this.studyRoomsService.getSearchSuggestions(searchDto.q);
  }

  @Post('join-by-code')
  @UseGuards(EmailVerifiedGuard)
  async joinByCode(@Req() req, @Body() joinByCodeDto: JoinByCodeDto) {
    return await this.studyRoomsService.joinRoomByCode(req.user.userId, joinByCodeDto.code);
  }

  @Get(':id')
  async getRoom(@Param('id') id: string) {
    return await this.studyRoomsService.getRoom(id);
  }

  @Patch(':id')
  async updateRoom(@Req() req, @Param('id') id: string, @Body() updateStudyRoomDto: UpdateStudyRoomDto) {
    return await this.studyRoomsService.updateRoom(req.user.userId, id, updateStudyRoomDto);
  }

  @Patch(':id/close')
  async closeRoom(@Req() req, @Param('id') id: string) {
    await this.studyRoomsService.closeRoom(req.user.userId, id);
    return { message: 'Oda başarıyla kapatıldı.' };
  }

  @Post(':id/join')
  @UseGuards(EmailVerifiedGuard)
  async joinRoom(@Req() req, @Param('id') id: string) {
    return await this.studyRoomsService.joinRoom(req.user.userId, id);
  }

  @Post(':id/leave')
  async leaveRoom(@Req() req, @Param('id') id: string) {
    await this.studyRoomsService.leaveRoom(req.user.userId, id);
    return { message: 'Odadan ayrıldınız.' };
  }

  @Patch(':id/status')
  async updateMyStatus(@Req() req, @Param('id') id: string, @Body() updateStatusDto: UpdateParticipantStatusDto) {
    return await this.studyRoomsService.updateParticipantStatus(req.user.userId, id, updateStatusDto.status);
  }

  @Delete(':id/participants/:userId')
  async kickParticipant(@Req() req, @Param('id') roomId: string, @Param('userId') targetUserId: string) {
    await this.studyRoomsService.kickParticipant(req.user.userId, roomId, targetUserId);
    return { message: 'Kullanıcı odadan çıkarıldı.' };
  }

  @Get(':id/participants')
  async getRoomParticipants(@Param('id') id: string) {
    return await this.studyRoomsService.getRoomParticipants(id);
  }
}
