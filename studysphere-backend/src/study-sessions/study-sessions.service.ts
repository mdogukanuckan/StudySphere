import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateStudySessionDto } from './dto/update-study-session.dto';
import { SessionStatus, SessionType, StudySession } from './entities/study-session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Topic } from '../topics/entities/topic.entity';
import { RoomParticipant } from '../study-room/entities/room-participant.entity';
import { UserStatisticsService } from '../user-statistics/user-statistics.service';
import { StudyRoomGateway } from '../study-room/study-room.gateway';
import { AchievementsService, UnlockedAchievement } from '../achievements/achievements.service';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private readonly sessionRepository: Repository<StudySession>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(RoomParticipant)
    private readonly roomParticipantRepository: Repository<RoomParticipant>,
    private readonly userStatisticsService: UserStatisticsService,
    private readonly roomGateway: StudyRoomGateway,
    private readonly achievementsService: AchievementsService,
  ) { }

  async startSession(userId: string, createDto: CreateStudySessionDto): Promise<StudySession> {
    const existingActive = await this.sessionRepository.findOne({
      where: { userId: userId, sessionStatus: In([SessionStatus.ACTIVE, SessionStatus.PAUSED]) },
    });

    if (existingActive) {
      throw new ConflictException('Zaten aktif (veya duraklatılmış) bir çalışma oturumunuz var. Lütfen önce onu sonlandırın.');
    }

    if (createDto.roomId) {
      const participant = await this.roomParticipantRepository.findOne({
        where: { roomId: createDto.roomId, userId, isActive: true },
      });
      if (!participant) {
        throw new ForbiddenException('Bu odanın kronometresini kullanabilmek için önce odaya katılmalısınız.');
      }
    }

    const topic = await this.topicRepository.findOne({
      where: { id: createDto.topicId },
      relations: {
        subject: {
          universe: true,
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Belirtilen ID ile eşleşen bir konu bulunamadı.');
    }

    const DEFAULT_POMODORO_DURATION_SECONDS = 25 * 60;
    const plannedDurationSeconds =
      createDto.sessionType === SessionType.POMODORO
        ? createDto.plannedDurationSeconds ?? DEFAULT_POMODORO_DURATION_SECONDS
        : null;

    const newSession = this.sessionRepository.create({
      userId: userId,
      topicId: topic.id,
      subjectId: topic.subject.id,
      universeId: topic.subject.universe.id,
      roomId: createDto.roomId ?? null,
      sessionType: createDto.sessionType,
      goal: createDto.goal,
      plannedDurationSeconds,
      sessionStatus: SessionStatus.ACTIVE,
      startTime: new Date(),
    });

    return await this.sessionRepository.save(newSession);
  }

  async endSession(sessionId: string, userId: string, updateStudySessionDto: UpdateStudySessionDto): Promise<StudySession & { newAchievements: UnlockedAchievement[] }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId: userId }
    });

    console.log(`[endSession] sessionId=${sessionId} userId=${userId} found=${!!session}`);

    if (!session) {
      throw new NotFoundException('Böyle bir çalışma oturumu bulunamadı.');
    }

    if (![SessionStatus.ACTIVE, SessionStatus.PAUSED].includes(session.sessionStatus)) {
      throw new BadRequestException('Bu oturum şu anda sonlandırılamaz.');
    }

    const endTime = new Date();
    const startTime = new Date(session.startTime);

    const maxPossibleDuration = parseInt(((endTime.getTime() - startTime.getTime()) / 1000).toString(), 10);

    let finalDurationSeconds = 0;
    if (updateStudySessionDto?.durationSeconds !== undefined) {
      finalDurationSeconds = Math.min(updateStudySessionDto.durationSeconds, maxPossibleDuration);
    } else {
      finalDurationSeconds = maxPossibleDuration;
    }

    if (updateStudySessionDto?.solvedQuestions !== undefined) session.questionCount = updateStudySessionDto.solvedQuestions;
    if (updateStudySessionDto?.correctAnswers !== undefined) session.correctCount = updateStudySessionDto.correctAnswers;
    if (updateStudySessionDto?.wrongAnswers !== undefined) session.wrongCount = updateStudySessionDto.wrongAnswers;

    session.endTime = endTime;
    session.durationSeconds = finalDurationSeconds;
    session.sessionStatus = SessionStatus.FINISHED;

    const savedSession = await this.sessionRepository.save(session);

    let newAchievements: UnlockedAchievement[] = [];
    try {
      const updatedStats = await this.userStatisticsService.updateStatistic(userId, {
        durationSeconds: savedSession.durationSeconds,
        correctQuestions: savedSession.correctCount || 0,
        incorrectQuestions: savedSession.wrongCount || 0
      });

      try {
        newAchievements = await this.achievementsService.evaluateAndUnlock(userId, {
          stats: updatedStats,
          session: savedSession,
        });
      } catch (achievementError) {
        console.error('Başarımlar değerlendirilirken bir hata oluştu:', achievementError);
      }
    } catch (error) {
      console.error('İstatistikler güncellenirken bir hata oluştu:', error);
    }

    return { ...savedSession, newAchievements };
  }
  async getStudyHistory(userId: string, page: number, limit: number, sessionType?: SessionType) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.sessionRepository.findAndCount({
      where: {
        user: { id: userId },
        sessionStatus: SessionStatus.FINISHED,
        ...(sessionType ? { sessionType } : {}),
      },
      order: { endTime: 'DESC' },
      skip: skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOnGoingSession(userId: string): Promise<StudySession | null> {
    return await this.sessionRepository.findOne({
      where: {
        user: { id: userId },
        sessionStatus: In([SessionStatus.ACTIVE, SessionStatus.PAUSED])
      }
    });
  }

  async cancelSession(id: string, userId: string): Promise<StudySession> {
    const session = await this.sessionRepository.findOne({
      where: { id, user: { id: userId } }
    });

    if (!session) {
      throw new NotFoundException('Böyle bir Oturum bulunamadı.');
    }
    if (![SessionStatus.ACTIVE, SessionStatus.PAUSED].includes(session.sessionStatus)) {
      throw new BadRequestException('Sadece aktif veya duraklatılmış bir oturum iptal edilebilir.')
    }
    session.sessionStatus = SessionStatus.CANCELLED;
    return this.sessionRepository.save(session);
  }

  async getSummaryById(id: string, userId: string): Promise<StudySession> {
    const session = await this.sessionRepository.findOne({
      where: { id, user: { id: userId } },
      relations: {
        topic: true,
        subject: true,
        universe: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Oturum detayı bulunamadı.');
    }

    return session;
  }

  async findOne(id: string, userId: string): Promise<StudySession> {
    const session = await this.sessionRepository.findOne({
      where: { id, userId }
    })

    if (!session) {
      throw new NotFoundException('Aradığınız oturum bulunamadı.');
    }
    return session;
  }

  async pauseSession(id: string, userId: string): Promise<StudySession> {

    const session = await this.findOne(id, userId);

    if (session.sessionStatus !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Bu oturumu durduramazsınız.');
    }

    session.sessionStatus = SessionStatus.PAUSED;
    const saved = await this.sessionRepository.save(session);
    if (saved.roomId) {
      this.roomGateway.emitSessionPauseChanged(saved.roomId, userId, saved.id, true);
    }
    return saved;
  }

  async resumeSession(id: string, userId: string): Promise<StudySession> {
    const session = await this.findOne(id, userId);

    if (session.sessionStatus !== SessionStatus.PAUSED) {
      throw new BadRequestException('Bu oturum henüz duraklatılmamış');
    }

    session.sessionStatus = SessionStatus.ACTIVE;
    const saved = await this.sessionRepository.save(session);
    if (saved.roomId) {
      this.roomGateway.emitSessionPauseChanged(saved.roomId, userId, saved.id, false);
    }
    return saved;
  }

  async getDailyStats(userId: string) {
    return await this.sessionRepository
      .createQueryBuilder('session')
      .select("DATE(session.startTime)", "date")
      .addSelect("SUM(session.durationSeconds)", "totalDuration")
      .where("session.userId = :userId", { userId })
      .andWhere("session.sessionStatus = :status", { status: SessionStatus.FINISHED })
      .groupBy("DATE(session.startTime)")
      .orderBy("date", "ASC")
      .getRawMany();
  }

  async getSubjectPerformance(userId: string) {
    const rows = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.universe', 'universe')
      .leftJoin('session.subject', 'subject')
      .leftJoin('session.topic', 'topic')
      .select('session.universeId', 'universeId')
      .addSelect('universe.name', 'universeName')
      .addSelect('session.subjectId', 'subjectId')
      .addSelect('subject.name', 'subjectName')
      .addSelect('session.topicId', 'topicId')
      .addSelect('topic.name', 'topicName')
      .addSelect('SUM(session.durationSeconds)', 'totalDuration')
      .addSelect('SUM(session.questionCount)', 'totalQuestions')
      .addSelect('SUM(session.correctCount)', 'totalCorrect')
      .addSelect('SUM(session.wrongCount)', 'totalWrong')
      .addSelect('COUNT(session.id)', 'sessionCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.sessionStatus = :status', { status: SessionStatus.FINISHED })
      .groupBy('session.universeId')
      .addGroupBy('universe.name')
      .addGroupBy('session.subjectId')
      .addGroupBy('subject.name')
      .addGroupBy('session.topicId')
      .addGroupBy('topic.name')
      .orderBy('universe.name', 'ASC')
      .addOrderBy('subject.name', 'ASC')
      .addOrderBy('topic.name', 'ASC')
      .getRawMany();

    type SubjectEntry = {
      subjectId: string;
      subjectName: string;
      totalDuration: number;
      totalQuestions: number;
      totalCorrect: number;
      totalWrong: number;
      sessionCount: number;
      topics: {
        topicId: string | null;
        topicName: string;
        totalDuration: number;
        totalQuestions: number;
        totalCorrect: number;
        totalWrong: number;
        sessionCount: number;
      }[];
    };

    const universeMap = new Map<string, {
      universeId: string;
      universeName: string;
      subjects: Map<string, SubjectEntry>;
    }>();

    for (const row of rows) {
      const universeId = row.universeId as string;
      const subjectId = row.subjectId as string;

      if (!universeMap.has(universeId)) {
        universeMap.set(universeId, {
          universeId,
          universeName: row.universeName ?? 'Bilinmeyen Evren',
          subjects: new Map<string, SubjectEntry>(),
        });
      }

      const universeEntry = universeMap.get(universeId)!;

      if (!universeEntry.subjects.has(subjectId)) {
        universeEntry.subjects.set(subjectId, {
          subjectId,
          subjectName: row.subjectName ?? 'Bilinmeyen Ders',
          totalDuration: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          totalWrong: 0,
          sessionCount: 0,
          topics: [],
        });
      }

      const duration = parseInt(row.totalDuration, 10) || 0;
      const questions = parseInt(row.totalQuestions, 10) || 0;
      const correct = parseInt(row.totalCorrect, 10) || 0;
      const wrong = parseInt(row.totalWrong, 10) || 0;
      const sessionCount = parseInt(row.sessionCount, 10) || 0;

      const subjectEntry = universeEntry.subjects.get(subjectId)!;
      subjectEntry.totalDuration += duration;
      subjectEntry.totalQuestions += questions;
      subjectEntry.totalCorrect += correct;
      subjectEntry.totalWrong += wrong;
      subjectEntry.sessionCount += sessionCount;

      subjectEntry.topics.push({
        topicId: row.topicId,
        topicName: row.topicId ? (row.topicName ?? 'Bilinmeyen Konu') : 'Genel (Konu Seçilmedi)',
        totalDuration: duration,
        totalQuestions: questions,
        totalCorrect: correct,
        totalWrong: wrong,
        sessionCount,
      });
    }

    return Array.from(universeMap.values()).map((universeEntry) => ({
      universeId: universeEntry.universeId,
      universeName: universeEntry.universeName,
      subjects: Array.from(universeEntry.subjects.values()),
    }));
  }

  async getModeBreakdown(userId: string) {
    const rows = await this.sessionRepository
      .createQueryBuilder('session')
      .select(`CASE WHEN session.roomId IS NULL THEN 'SOLO' ELSE 'SOCIAL' END`, 'mode')
      .addSelect('SUM(session.durationSeconds)', 'totalDuration')
      .addSelect('COUNT(session.id)', 'sessionCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.sessionStatus = :status', { status: SessionStatus.FINISHED })
      .groupBy('mode')
      .getRawMany();

    const result = {
      solo: { totalDuration: 0, sessionCount: 0 },
      social: { totalDuration: 0, sessionCount: 0 },
    };

    for (const row of rows) {
      const bucket = row.mode === 'SOLO' ? result.solo : result.social;
      bucket.totalDuration = parseInt(row.totalDuration, 10) || 0;
      bucket.sessionCount = parseInt(row.sessionCount, 10) || 0;
    }

    return result;
  }
}
