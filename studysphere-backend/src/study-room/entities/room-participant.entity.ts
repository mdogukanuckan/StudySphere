import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StudyRoom } from "./study-room.entity";
import { User } from "src/users/entities/user.entity";
import { ParticipantStatus } from "../enums/participant-status.enum";

@Entity('room_pariticipants')
@Index('idx_room_participants_one_active_per_user', ['userId'], { unique: true, where: '"is_active" = true' })
export class RoomParticipant{
    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({name: 'room_id', type : 'uuid'})
    roomId !: string;

    @Column({name: 'user_id', type : 'uuid'})
    userId !: string;

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