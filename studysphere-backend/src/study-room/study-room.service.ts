import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { StudyRoom } from "./entities/study-room.entity";
import { Repository } from "typeorm";
import { RoomParticipant } from "./entities/room-participant.entity";
import { DataSource } from "typeorm";
import { CreateStudyRoomDto } from "./dto/create-study-room.dto";
import { RoomStatus } from "./enums/room-status.enum";
import { RoomFilterDto } from "./dto/room-filter.dto";
import { UpdateStudyRoomDto } from "./dto/update-study-room.dto";
import { ParticipantStatus } from "./enums/participant-status.enum";
import { StudyRoomGateway } from "./study-room.gateway";
import { SessionStatus, StudySession } from "../study-sessions/entities/study-session.entity";

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
  ) { }

  async createRoom(userId: string, createDto: CreateStudyRoomDto): Promise<StudyRoom> {
    await this.checkUserActiveInAnyRoom(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = queryRunner.manager.create(StudyRoom, {
        ...createDto,
        ownerId: userId,
        currentParticipants: 1,
        status: RoomStatus.ACTIVE,
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
      // checkUserActiveInAnyRoom yukarıda transaction başlamadan ÖNCE çalıştığı için,
      // aynı kullanıcıdan gelen eşzamanlı iki istek ikisi de bu kontrolü geçebilir.
      // Asıl garanti artık RoomParticipant'taki partial unique index'ten geliyor;
      // ikinci isteğin INSERT'i buna çarpınca burada yakalayıp aynı dostça mesajı veriyoruz.
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

  async getRooms(filterDto: RoomFilterDto): Promise<StudyRoom[]> {
    const query = this.roomRepository.createQueryBuilder('room')
      // owner ilişkisinden sadece görüntülemek için gereken alanları seçiyoruz
      // (leftJoinAndSelect tüm User kolonlarını, passwordHash dahil, döndürürdü).
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

    // Kapatılmasının üzerinden 1 saatten fazla geçmiş kapalı odalar oda
    // listesinde artık hiç görünmesin — istek, gereksiz yere veritabanından
    // çekilmemesi yönünde olduğu için bu eleme uygulama katmanında değil,
    // doğrudan burada (WHERE koşulunda) yapılıyor. closed_at bu alandan önce
    // kapatılmış eski odalarda boş olabileceğinden, closed_at yoksa updated_at'e
    // (closeRoom sırasında zaten güncelleniyor) düşüyoruz.
    const closedRoomVisibilityCutoff = new Date(Date.now() - 60 * 60 * 1000);
    query.andWhere(
      "(room.status != :closedStatus OR COALESCE(room.closed_at, room.updated_at) > :closedRoomVisibilityCutoff)",
      { closedStatus: RoomStatus.CLOSED, closedRoomVisibilityCutoff },
    );

    const rooms = await query.orderBy('room.createdAt', 'DESC').getMany();
    if (rooms.length === 0) return rooms;

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

    return rooms;
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
      // pessimistic_write ("SELECT ... FOR UPDATE"): bu satırı okuyup kapasiteyi
      // kontrol ettiğimiz an ile katılımcıyı ekleyip sayaç güncellediğimiz an arasında
      // başka bir transaction'ın AYNI odaya eşzamanlı katılıp kapasiteyi aşmasını
      // engeller. Önceden burada hiç satır kilidi yoktu; iki istek aynı anda
      // room.currentParticipants'ı okuyup ikisi de "kapasite dolu değil" sonucuna
      // varabiliyor, ikisi de katılabiliyordu.
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

      // Oda sayısını artır
      room.currentParticipants += 1;
      await queryRunner.manager.save(room);

      await queryRunner.commitTransaction();
      // Aynı odadaki diğer katılımcılara (kanala bağlıysalar) anlık haber ver.
      // Gerçek veri her zaman REST'ten geliyor; bu sadece "yenile" sinyali.
      this.gateway.emitParticipantJoined(roomId, userId);
      return participant;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // bkz. createRoom'daki aynı yorum: "tek aktif oda" kuralının asıl garantisi
      // artık DB'deki partial unique index'ten geliyor, burada sadece dostça mesaja çeviriyoruz.
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

  // 'kicked': kickParticipant() bu metodu yeniden kullanıyor (bkz. aşağısı) —
  // odadaki diğer katılımcılara "ayrıldı" mı yoksa "atıldı" mı olduğunu ayrı
  // bir olay alanı olarak iletebilmek için eklendi.
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
      // Odayı kapat
      room.status = RoomStatus.CLOSED;
      room.currentParticipants = 0;
      room.closedAt = new Date();
      await queryRunner.manager.save(room);

      // Aktif tüm katılımcıları (owner dahil) odadan çıkar
      await queryRunner.manager.update(
        RoomParticipant,
        { roomId: roomId, isActive: true },
        { isActive: false, leftAt: new Date() }
      );

      await queryRunner.commitTransaction();
      // Kapatılırken odada aktif katılımcı varsa (owner hariç, o zaten
      // kapatma isteğini kendisi yaptı), onlara haber ver — aksi halde
      // ekranlarını kapatıp açana kadar odanın hâlâ açık olduğunu sanırlardı.
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

    await this.leaveRoom(targetUserId, roomId, true); // Reuse leave logic, kicked=true
  }

  async getRoomParticipants(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Oda bulunamadı.');

    const participants = await this.participantRepository.find({
      where: { roomId: roomId, isActive: true },
      relations: { user: true },
    });

    // Kronometresi şu an duraklatılmış olan katılımcıları buluyoruz — bu,
    // 'currentStatus' (WORKING/BREAK, elle değiştirilen oda-içi durum) alanından
    // AYRI bir kavram: StudySession.sessionStatus (ActiveSessionWidget'taki
    // duraklat/devam butonu). WebSocket üzerinden anlık yayınlanan
    // session:paused/resumed olaylarının (bkz. study-room.gateway.ts) REST
    // tarafındaki kalıcı karşılığı burası — ekran yeniden açıldığında da
    // doğru gösterilsin diye.
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

  private async checkUserActiveInAnyRoom(userId: string): Promise<void> {
    const activeSession = await this.participantRepository.findOne({
      where: { userId: userId, isActive: true },
      relations: { room: true },
    });
    if (!activeSession) return;

    // Oda gerçekte kapatılmış (status: CLOSED) ama katılımcı kaydı eski/bozuk bir kapatma
    // akışından dolayı aktif kalmışsa, burada kendiliğinden temizleyip kullanıcıyı bloklamıyoruz.
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

  // RoomParticipant entity'sindeki partial unique index (bkz. o dosyadaki yorum),
  // Postgres'te "23505 unique_violation" hatası olarak geri döner. checkUserActiveInAnyRoom
  // ön-kontrolünü yarış durumunda atlatan istekler burada yakalanıyor.
  private isActiveParticipantConflict(error: unknown): boolean {
    return !!error && typeof error === 'object' && (error as { code?: string }).code === '23505';
  }

}