import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FriendshipStatus } from "../enums/friendship-status.enum";

@Entity('friendships')
@Index(['requesterId', 'addresseeId'], { unique: true })
export class Friendship {
    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'requester_id', type: 'uuid' })
    requesterId !: string;

    @Column({ name: 'addressee_id', type: 'uuid' })
    addresseeId !: string;

    @Column({ type: 'enum', enum: FriendshipStatus, default: FriendshipStatus.PENDING })
    status !: FriendshipStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt !: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requester_id' })
    requester !: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'addressee_id' })
    addressee !: User;
}
