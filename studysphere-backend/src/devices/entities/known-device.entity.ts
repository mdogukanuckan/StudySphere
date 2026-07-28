import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('known_devices')
@Index('idx_known_device_user_device', ['userId', 'deviceId'], { unique: true })
export class KnownDevice {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    @Index()
    userId!: string;

    @Column({ name: 'device_id', type: 'varchar', length: 255 })
    deviceId!: string;

    @Column({ name: 'device_name', type: 'varchar', length: 255, nullable: true })
    deviceName!: string | null;

    @Column({ name: 'last_login_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    lastLoginAt!: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;
}
