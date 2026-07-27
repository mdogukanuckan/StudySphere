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

    // Kronometre bir oda içinden başlatılıyorsa (roomId gönderildiyse), kullanıcının
    // o odada gerçekten (hâlâ aktif) katılımcı olduğunu doğruluyoruz. Aksi halde
    // odaya katılmadan o odanın kronometresini kullanabilirdi.
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

    // Pomodoro süresi artık sabit 25 dakika değil — kullanıcı istemciden
    // (StudySessionSetupModal.tsx) serbestçe seçebiliyor. Hiç gönderilmezse
    // (ör. eski bir istemci sürümü) geriye dönük uyumluluk için yine de
    // 25 dakikaya (1500 sn) düşüyoruz. FREE seanslarda bu alanın hiçbir
    // anlamı olmadığından her zaman null bırakılır.
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
      // Yukarıda doğrulanan roomId burada kaydedilmezse, seansın bir oda
      // üzerinden mi (sosyal) yoksa doğrudan mı (solo) başlatıldığı hiçbir
      // zaman bilinemez — istatistiklerdeki solo/sosyal kırılımı bu alana dayanır.
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

      // Başarımlar, güncel kümülatif istatistiklere VE az önce biten seansın
      // kendisine (hatasız-seans kontrolü için) ihtiyaç duyuyor — bu yüzden
      // updateStatistic()'in döndürdüğü güncel satır burada kullanılıyor.
      // Aynı non-fatal try/catch deseni: bir başarım hatası seansın
      // sonlandırılmasını ASLA engellememeli.
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
        // sessionType verilmişse (FREE/POMODORO), geçmişi o türe göre filtreler
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
    // "Ongoing" hem ACTIVE hem PAUSED durumundaki seansı kapsamalı; aksi halde
    // bir seans durdurulduğunda burası onu bulamaz ve istemci "aktif seans yok" sanır.
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
    // Mobildeki yeni "seans detayı" ekranı (istatistik geçmişindeki kartlara
    // tıklanınca açılıyor) evren/ders/konu bağlamını da göstermek istiyor;
    // önceden sadece 'topic' ilişkisi yükleniyordu. where'de 'user: { id: userId }'
    // zaten sorguyu isteği yapan kullanıcının kendi oturumlarıyla sınırlıyor,
    // yani bu uç zaten IDOR'a karşı güvenliydi — sadece döndürülen veri genişletildi.
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
    // Seans bir oda üzerinden (sosyal) başlatıldıysa, aynı odadaki diğer
    // katılımcılara bu kronometrenin duraklatıldığını anlık bildiriyoruz.
    // Solo seanslarda roomId null olduğundan hiçbir şey yayınlanmaz.
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
  return await this.sessionRepository
    .createQueryBuilder('session')
    .select('session.subject_id', 'subjectId')
    .addSelect('SUM(session.duration_seconds)', 'totalDuration')
    .where('session.user_id = :userId', { userId })
    .andWhere('session.session_status = :status', { status: 'FINISHED' })
    .groupBy('session.subject_id')
    .getRawMany();
}

  // Bitmiş seansları "solo" (doğrudan konu seçilerek) ve "sosyal" (bir odaya
  // katılarak ya da oda oluşturarak) olmak üzere ikiye ayırıp her biri için
  // toplam süre ve oturum sayısını döner. Ayrım, startSession() içinde
  // kaydedilen roomId alanına dayanır: null => SOLO, dolu => SOCIAL.
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