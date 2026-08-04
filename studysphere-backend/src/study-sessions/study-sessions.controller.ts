import { Controller, Get, Post, Body, Patch, Param, Req, UseGuards, Query, ParseUUIDPipe } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateStudySessionDto } from './dto/update-study-session.dto';
import { SessionType } from './entities/study-session.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

const TURKEY_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
type PerformanceRange = 'week' | 'month';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) { }

  @Post('start')
  async start(@Req() req: any, @Body() createDto: CreateStudySessionDto) {
    const userId = req.user.userId;
    return this.studySessionsService.startSession(userId, createDto);
  }

  @Get('active')
  async getActiveSession(@Req() req: any) {
    return this.studySessionsService.getOnGoingSession(req.user.userId);
  }

  @Get('ongoing')
  async getOngoingAlias(@Req() req: any) {
    return this.studySessionsService.getOnGoingSession(req.user.userId);
  }

  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('page') pageQuery?: string,
    @Query('limit') limitQuery?: string,
    @Query('sessionType') sessionType?: SessionType,
  ) {
    const userId = req.user.userId;
    const parsedPage = Number(pageQuery);
    const parsedLimit = Number(limitQuery);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    return this.studySessionsService.getStudyHistory(userId, page, limit, sessionType);
  }

  @Get('daily-stats')
  async getDailyStats(@Req() req: any) {
    return await this.studySessionsService.getDailyStats(req.user.userId);
  }

  private resolvePerformanceRange(range?: string): { start: Date; end: Date } | undefined {
    if (range !== 'week' && range !== 'month') {
      return undefined;
    }

    const typedRange = range as PerformanceRange;
    const now = new Date();
    const shifted = new Date(now.getTime() + TURKEY_UTC_OFFSET_MS);
    const year = shifted.getUTCFullYear();
    const month = shifted.getUTCMonth();
    const day = shifted.getUTCDate();
    const todayMidnightUtc = new Date(Date.UTC(year, month, day) - TURKEY_UTC_OFFSET_MS);

    const start = typedRange === 'week'
      ? new Date(todayMidnightUtc.getTime() - 6 * 24 * 60 * 60 * 1000)
      : new Date(Date.UTC(year, month, 1) - TURKEY_UTC_OFFSET_MS);

    return { start, end: now };
  }

  @Get('performance/subjects')
  async getSubjectPerformance(@Req() req: any, @Query('range') range?: string) {
    const userId = req.user.userId;
    const dateRange = this.resolvePerformanceRange(range);
    return await this.studySessionsService.getSubjectPerformance(userId, dateRange);
  }

  @Get('performance/mode')
  async getModeBreakdown(@Req() req: any) {
    const userId = req.user.userId;
    return await this.studySessionsService.getModeBreakdown(userId);
  }

  @Get(':id')
  async getSummaryById(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return await this.studySessionsService.getSummaryById(id, req.user.userId);
  }

  @Patch(':id/end')
  async endSession(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string, @Body() updateDto: UpdateStudySessionDto) {
    const userId = req.user.userId;
    return this.studySessionsService.endSession(id, userId, updateDto);
  }

  @Patch(':id/cancel')
  async cancelSession(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return await this.studySessionsService.cancelSession(id, req.user.userId);
  }

  @Patch(':id/pause')
  async pauseSession(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    const userId = req.user.userId;
    return await this.studySessionsService.pauseSession(id, userId);
  }

  @Patch(':id/resume')
  async resumeSession(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    const userId = req.user.userId;
    return await this.studySessionsService.resumeSession(id, userId);
  }
}
