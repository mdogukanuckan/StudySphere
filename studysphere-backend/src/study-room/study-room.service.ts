import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { StudyRoom } from "./entities/study-room.entity";
import { EntityManager, Repository } from "typeorm";
import { RoomParticipant } from "./entities/room-participant.entity";
import { DataSource } from "typeorm";
import { CreateStudyRoomDto } from "./dto/create-study-room.dto";
import { RoomStatus } from "./enums/room-status.enum";
import { RoomFilterDto } from "./dto/room-filter.dto";
import { UpdateStudyRoomDto } from "./dto/update-study-room.dto";
import { ParticipantStatus } from "./enums/participant-status.enum";
import { StudyRoomGateway } from "./study-room.gateway";
import { SessionStatus, StudySession } from "../study-sessions/entities/study-session.entity";
import { UsersService } from "../users/users.service";

const MAX_JOIN_BY_CODE_ATTEMPTS = 5;
const JOIN_BY_CODE_LOCK_MS = 10 * 60 * 1000;
const SEARCH_RESULTS_LIMIT = 50;
const SEARCH_SUGGESTIONS_PER_TYPE = 5;
const SEARCH_SUGGESTIONS_TOTAL_LIMIT = 10;

export type RoomSearchSuggestionType = 'title' | 'universe' | 'subject' | 'topic';

export interface RoomSearchSuggestion {
  label: string;
  type: RoomSearchSuggestionType;
}

@Injectable()
export class StudyRoomService {
  constructor(
    @InjectRepository(StudyRoom)
    private readonly roomRepository: Repository<StudyRoom>,
    @InjectRepository(RoomParticipant)
    private readonly participantRepository: Repository<RoomParticipant>,
    @InjectRepository(StudySession)
    private readonly studySessionRepository: Repository<StudySession>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly gateway: StudyRoomGateway,
    private readonly usersService: UsersService,
  ) { }

  async createRoom(userId: string, createDto: CreateStudyRoomDto): Promise<StudyRoom> {
    await this.checkUserActiveInAnyRoom(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inviteCode = createDto.isPrivate
        ? await this.generateUniqueInviteCode(queryRunner.manager)
        : null;

      const room = queryRunner.manager.create(StudyRoom, {
        ...createDto,
        ownerId: userId,
        currentParticipants: 1,
        status: RoomStatus.ACTIVE,
        isPrivate: !!createDto.isPrivate,
        inviteCode,
      });
      const savedRoom = await queryRunner.manager.save(room);

      const participant = queryRunner.manager.create(RoomParticipant, {
        roomId: savedRoom.id,
        userId: userId,
        isActive: true,
        lastActivity: new Date(),
      });
      await queryRunner.manager.save(participant);

      await queryRunner.commitTransaction();
      return await this.getRoom(savedRoom.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (this.isActiveParticipantConflict(error)) {
        throw new BadRequestException(
          'Zaten aktif bir odadasınız. Yeni bir oda kurmak için önce mevcut odadan ayrılın (oda sahibiyseniz kapatın).',
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getRooms(filterDto: RoomFilterDto, userId: string): Promise<StudyRoom[]> {
    const query = this.roomRepository.createQueryBuilder('room')
      .leftJoin('room.owner', 'owner')
      .addSelect(['owner.id', 'owner.username'])
      .leftJoinAndSelect('room.universe', 'universe')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.topic', 'topic')
      .where('1=1');
    if (filterDto.universe_id) query.andWhere('room.universe_id = :universe_id', { universe_id: filterDto.universe_id });
    if (filterDto.subject_id) query.andWhere('room.subject_id = :subject_id', { subject_id: filterDto.subject_id });
    if (filterDto.topic_id) query.andWhere('room.topic_id = :topic_id', { topic_id: filterDto.topic_id });
    if (filterDto.status) query.andWhere('room.status = :status', { status: filterDto.status });

    const closedRoomVisibilityCutoff = new Date(Date.now() - 60 * 60 * 1000);
    query.andWhere(
      "(room.status != :closedStatus OR COALESCE(room.closed_at, room.updated_at) > :closedRoomVisibilityCutoff)",
      { closedStatus: RoomStatus.CLOSED, closedRoomVisibilityCutoff },
    );

    query.andWhere(
      `(room.is_private = false OR room.owner_id = :userId OR EXISTS (
        SELECT 1 FROM room_pariticipants rp
        WHERE rp.room_id = room.id AND rp.user_id = :userId AND rp.is_active = true
      ))`,
      { userId },
    );

    const rooms = await query.orderBy('room.createdAt', 'DESC').getMany();
    await this.attachParticipantCounts(rooms);
    return rooms;
  }

  async searchPublicRooms(rawQuery: string): Promise<StudyRoom[]> {
    const term = `%${rawQuery.trim()}%`;

    const rooms = await this.roomRepository.createQueryBuilder('room')
      .leftJoin('room.owner', 'owner')
      .addSelect(['owner.id', 'owner.username'])
      .leftJoinAndSelect('room.universe', 'universe')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.topic', 'topic')
      .where('room.is_private = false')
      .andWhere('room.status = :status', { status: RoomStatus.ACTIVE })
      .andWhere(
        '(room.title ILIKE :term OR universe.name ILIKE :term OR subject.name ILIKE :term OR topic.name ILIKE :term)',
        { term },
      )
      .orderBy('room.createdAt', 'DESC')
      .take(SEARCH_RESULTS_LIMIT)
      .getMany();

    await this.attachParticipantCounts(rooms);
    return rooms;
  }

  async getSearchSuggestions(rawQuery: string): Promise<RoomSearchSuggestion[]> {
    const term = `%${rawQuery.trim()}%`;

    const universeRows = await this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.universe', 'universe')
      .select('DISTINCT universe.name', 'label')
      .where('room.is_private = false')
      .andWhere('room.status = :status', { status: RoomStatus.ACTIVE })
      .andWhere('universe.name ILIKE :term', { term })
      .limit(SEARCH_SUGGESTIONS_PER_TYPE)
      .getRawMany<{ label: string }>();

    const subjectRows = await this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.subject', 'subject')
      .select('DISTINCT subject.name', 'label')
      .where('room.is_private = false')
      .andWhere('room.status = :status', { status: RoomStatus.ACTIVE })
      .andWhere('subject.name ILIKE :term', { term })
      .limit(SEARCH_SUGGESTIONS_PER_TYPE)
      .getRawMany<{ label: string }>();

    const topicRows = await this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.topic', 'topic')
      .select('DISTINCT topic.name', 'label')
      .where('room.is_private = false')
      .andWhere('room.status = :status', { status: RoomStatus.ACTIVE })
      .andWhere('topic.name ILIKE :term', { term })
      .limit(SEARCH_SUGGESTIONS_PER_TYPE)
      .getRawMany<{ label: string }>();

    const titleRows = await this.roomRepository.createQueryBuilder('room')
      .select('DISTINCT room.title', 'label')
      .where('room.is_private = false')
      .andWhere('room.status = :status', { status: RoomStatus.ACTIVE })
      .andWhere('room.title ILIKE :term', { term })
      .limit(SEARCH_SUGGESTIONS_PER_TYPE)
      .getRawMany<{ label: string }>();

    const suggestions: RoomSearchSuggestion[] = [];
    const seen = new Set<string>();

    const pushRows = (rows: { label: string }[], type: RoomSearchSuggestionType) => {
      rows.forEach((row) => {
        const key = `${type}:${row.label.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({ label: row.label, type });
        }
      });
    };

    pushRows(universeRows, 'universe');
    pushRows(subjectRows, 'subject');
    pushRows(topicRows, 'topic');
    pushRows(titleRows, 'title');

    return suggestions.slice(0, SEARCH_SUGGESTIONS_TOTAL_LIMIT);
  }

  async getRoom(id: string): Promise<StudyRoom> {
    const room = await this.roomRepository.createQueryBuilder('room')
      .leftJoin('room.owner', 'owner')
      .addSelect(['owner.id', 'owner.username'])
      .leftJoinAndSelect('room.universe', 'universe')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.topic', 'topic')
      .where('room.id = :id', { id })
      .getOne();
    if (!room) throw new NotFoundException('Çalışma odası bulunamadı.');

    room.currentParticipants = await this.participantRepository.createQueryBuilder('participant')
      .innerJoin('participant.user', 'user')
      .where('participant.roomId = :id', { id })
      .andWhere('participant.isActive = true')
      .andWhere('user.deletedAt IS NULL')
      .getCount();

    return room;
  }

  async updateRoom(userId: string, roomId: string, updateDto: UpdateStudyRoomDto): Promise<StudyRoom> {
    const room = await this.getRoom(roomId);
    if (room.ownerId !== userId) throw new ForbiddenException('Sadece oda sahibi güncelleyebilir.');

    Object.assign(room, updateDto);
    return await this.roomRepository.save(room);
  }

  async joinRoom(userId: string, roomId: string): Promise<RoomParticipant> {
    await this.checkUserActiveInAnyRoom(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne(StudyRoom, {
        where: { id: roomId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!room) throw new NotFoundException('Oda bulunamadı.');
      if (room.status === RoomStatus.CLOSED) throw new BadRequestException('Bu oda kapalı.');
      if (room.currentParticipants >= room.maxParticipants) throw new BadRequestException('Oda kapasitesi dolu.');

      const participant = queryRunner.manager.create(RoomParticipant, {
        roomId: roomId,
        userId: userId,
        isActive: true,
        lastActivity: new Date(),
      });
      await queryRunner.manager.save(participant);

      room.currentParticipants += 1;
      await queryRunner.manager.save(room);

      await queryRunner.commitTransaction();
      this.gateway.emitParticipantJoined(roomId, userId);
      return participant;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (this.isActiveParticipantConflict(error)) {
        throw new BadRequestException(
          'Zaten aktif bir odadasınız. Bu odaya katılmak için önce mevcut odadan ayrılın (oda sahibiyseniz kapatın).',
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async joinRoomByCode(userId: string, code: string): Promise<RoomParticipant> {
    const lockState = await this.usersService.getJoinByCodeLockState(userId);
    if (lockState.joinByCodeLockedUntil && new Date(lockState.joinByCodeLockedUntil).getTime() > Date.now()) {
      const waitMinutes = Math.ceil((new Date(lockState.joinByCodeLockedUntil).getTime() - Date.now()) / 60000);
      throw new BadRequestException(
        `Çok fazla hatalı davet kodu denemesi yaptınız. Lütfen ${waitMinutes} dakika sonra tekrar deneyin.`,
      );
    }

    const room = await this.roomRepository.findOne({ where: { inviteCode: code, isPrivate: true } });
    if (!room) {
      const attempts = await this.usersService.incrementJoinByCodeFailedAttempts(userId);
      if (attempts >= MAX_JOIN_BY_CODE_ATTEMPTS) {
        await this.usersService.lockJoinByCode(userId, new Date(Date.now() + JOIN_BY_CODE_LOCK_MS));
      }
      throw new NotFoundException('Geçersiz davet kodu.');
    }

    await this.usersService.resetJoinByCodeFailedAttempts(userId);
    return this.joinRoom(userId, room.id);
  }

  async leaveRoom(userId: string, roomId: string, kicked: boolean = false): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = await queryRunner.manager.findOne(StudyRoom, { where: { id: roomId } });
      if (!room) throw new NotFoundException('Oda bulunamadı.');
      if (room.ownerId === userId) throw new BadRequestException('Oda sahibi odadan çıkamaz, odayı kapatmalıdır.');

      const participant = await queryRunner.manager.findOne(RoomParticipant, {
        where: { roomId: roomId, userId: userId, isActive: true },
      });

      if (!participant) throw new BadRequestException('Bu odada aktif değilsiniz.');

      participant.isActive = false;
      participant.leftAt = new Date();
      await queryRunner.manager.save(participant);

      room.currentParticipants = Math.max(0, room.currentParticipants - 1);
      await queryRunner.manager.save(room);

      await queryRunner.commitTransaction();
      this.gateway.emitParticipantLeft(roomId, userId, kicked);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async closeRoom(userId: string, roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (room.ownerId !== userId) throw new ForbiddenException('Sadece oda sahibi odayı kapatabilir.');
    if (room.status === RoomStatus.CLOSED) throw new BadRequestException('Oda zaten kapalı.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      room.status = RoomStatus.CLOSED;
      room.currentParticipants = 0;
      room.closedAt = new Date();
      await queryRunner.manager.save(room);

      await queryRunner.manager.update(
        RoomParticipant,
        { roomId: roomId, isActive: true },
        { isActive: false, leftAt: new Date() }
      );

      await queryRunner.commitTransaction();
      this.gateway.emitRoomClosed(roomId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateParticipantStatus(userId: string, roomId: string, status: ParticipantStatus): Promise<RoomParticipant> {
    if (!Object.values(ParticipantStatus).includes(status)) {
      throw new BadRequestException('Geçersiz durum.');
    }

    const participant = await this.participantRepository.findOne({
      where: { roomId: roomId, userId: userId, isActive: true },
    });

    if (!participant) {
      throw new BadRequestException('Bu odada aktif değilsiniz.');
    }

    participant.currentStatus = status;
    participant.lastActivity = new Date();
    const saved = await this.participantRepository.save(participant);
    this.gateway.emitParticipantStatusChanged(roomId, userId, saved.currentStatus);
    return saved;
  }

  async kickParticipant(ownerId: string, roomId: string, targetUserId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (room.ownerId !== ownerId) throw new ForbiddenException('Sadece oda sahibi üye atabilir.');
    if (ownerId === targetUserId) throw new BadRequestException('Kendinizi atamazsınız.');

    await this.leaveRoom(targetUserId, roomId, true);
  }

  async getRoomParticipants(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Oda bulunamadı.');

    const participants = await this.participantRepository.find({
      where: { roomId: roomId, isActive: true },
      relations: { user: true },
    });

    const pausedSessions = await this.studySessionRepository.find({
      where: { roomId, sessionStatus: SessionStatus.PAUSED },
    });
    const pausedUserIds = new Set(pausedSessions.map((s) => s.userId));

    return participants
      .filter((p) => p.user)
      .map((p) => ({
        id: p.user.id,
        username: p.user.username,
        isOwner: p.user.id === room.ownerId,
        isOnline: true,
        currentStatus: p.currentStatus,
        joinedAt: p.joinedAt,
        isSessionPaused: pausedUserIds.has(p.user.id),
      }));
  }

  private async attachParticipantCounts(rooms: StudyRoom[]): Promise<void> {
    if (rooms.length === 0) return;

    const counts = await this.participantRepository.createQueryBuilder('participant')
      .innerJoin('participant.user', 'user')
      .select('participant.roomId', 'roomId')
      .addSelect('COUNT(*)', 'count')
      .where('participant.isActive = true')
      .andWhere('user.deletedAt IS NULL')
      .andWhere('participant.roomId IN (:...roomIds)', { roomIds: rooms.map((r) => r.id) })
      .groupBy('participant.roomId')
      .getRawMany<{ roomId: string; count: string }>();

    const countByRoomId = new Map(counts.map((c) => [c.roomId, Number(c.count)]));
    rooms.forEach((room) => {
      room.currentParticipants = countByRoomId.get(room.id) ?? 0;
    });
  }

  private async checkUserActiveInAnyRoom(userId: string): Promise<void> {
    const activeSession = await this.participantRepository.findOne({
      where: { userId: userId, isActive: true },
      relations: { room: true },
    });
    if (!activeSession) return;

    if (!activeSession.room || activeSession.room.status === RoomStatus.CLOSED) {
      activeSession.isActive = false;
      activeSession.leftAt = new Date();
      await this.participantRepository.save(activeSession);
      return;
    }

    throw new BadRequestException(
      `Zaten "${activeSession.room.title}" adlı odada aktifsiniz. Yeni bir odaya katılmak veya kurmak için önce mevcut odadan ayrılın (oda sahibiyseniz kapatın).`,
    );
  }

  private isActiveParticipantConflict(error: unknown): boolean {
    return !!error && typeof error === 'object' && (error as { code?: string }).code === '23505';
  }

  private async generateUniqueInviteCode(manager: EntityManager): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await manager.findOne(StudyRoom, { where: { inviteCode: code } });
      if (!existing) return code;
    }
    throw new BadRequestException('Davet kodu üretilemedi, lütfen tekrar deneyin.');
  }

}
