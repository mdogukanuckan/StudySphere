import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StudyRoom } from "./study-room.entity";
import { User } from "src/users/entities/user.entity";
import { ParticipantStatus } from "../enums/participant-status.enum";

// "Bir kullanıcı aynı anda sadece tek bir odada aktif olabilir" kuralını artık
// sadece uygulama kodundaki bir ön-kontrol (checkUserActiveInAnyRoom) değil, DB
// seviyesinde de bu kısmi (partial) unique index garanti ediyor. Eşzamanlı iki
// istek ön-kontrolü aynı anda geçse bile, ikinci INSERT bu index'e çarpıp
// reddediliyor — servis katmanında bu çakışma yakalanıp kullanıcı dostu bir
// hataya çevriliyor (bkz. isActiveParticipantConflict).
@Entity('room_pariticipants')
@Index('idx_room_participants_one_active_per_user', ['userId'], { unique: true, where: '"is_active" = true' })
export class RoomParticipant{
    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({name: 'room_id', type : 'uuid'})
    roomId !: string;

    @Column({name: 'user_id', type : 'uuid'})
    userId !: string;

    // 'timestamp' yerine 'timestamptz': bu sütun katılımcının odaya girdiği
    // ANI (mutlak zaman) temsil ediyor. 'timestamp' ile Postgres UTC saatini
    // "saat dilimsiz" saklıyordu ve bu değeri geri okurken/JSON'a çevirirken
    // Node sürecinin yerel saat dilimine göre yanlış yorumlanabiliyordu —
    // Participants.tsx'teki "3 saattir burada" hatasının ve RoomDetail'daki
    // kronometrenin oda açılır açılmaz 3 saat ileriden başlaması gibi
    // görünmesinin kök nedeni buydu. timestamptz bu belirsizliği tamamen ortadan kaldırır.
    @CreateDateColumn({name: 'joined_at', type: 'timestamptz'})
    joinedAt !: Date;

    @Column({name : 'left_at', type : 'timestamptz', nullable : true})
    leftAt !: Date;

    @Column({name: 'last_activity',type: 'timestamptz', nullable : true})
    lastActivity !: Date;

    @Column({name: 'is_active', type : 'boolean', default : true})
    isActive !: boolean;

    @Column({name: 'current_status', type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.WORKING})
    currentStatus !: ParticipantStatus;

    @ManyToOne(() => StudyRoom, (room) => room.participants)
    @JoinColumn({ name: 'room_id' })
    room !: StudyRoom;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user !: User;

}