import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StudyRoom } from "../../study-room/entities/study-room.entity";
import { User } from "../../users/entities/user.entity";
import { RoomInviteStatus } from "../enums/room-invite-status.enum";

// Uygulama içinde (chat olmadan) bir arkadaşa doğrudan bir çalışma odasına
// davet gönderebilmek için — kullanıcı bekleyen davetlerini "Davetlerim"
// ekranında görür, kod girmesine gerek kalmadan tek dokunuşla katılabilir.
// Bkz. room-invites.service.ts.
@Entity('room_invites')
// Aynı kişiye aynı oda için birden fazla PENDING davet birikmesin diye
// kısmi (partial) unique index — study-room'daki RoomParticipant'ın
// "tek aktif katılım" indeksiyle aynı desen.
@Index('idx_room_invite_one_pending_per_target', ['roomId', 'toUserId'], { unique: true, where: '"status" = \'PENDING\'' })
export class RoomInvite {
    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'room_id', type: 'uuid' })
    roomId !: string;

    @Column({ name: 'from_user_id', type: 'uuid' })
    fromUserId !: string;

    @Column({ name: 'to_user_id', type: 'uuid' })
    toUserId !: string;

    @Column({ type: 'enum', enum: RoomInviteStatus, default: RoomInviteStatus.PENDING })
    status !: RoomInviteStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt !: Date;

    @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
    respondedAt !: Date | null;

    @ManyToOne(() => StudyRoom, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room !: StudyRoom;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'from_user_id' })
    fromUser !: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'to_user_id' })
    toUser !: User;
}
