import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Universe } from "./universe.entity";


@Entity('user_universes')
@Index(['userId', 'universeId'], { unique: true })
export class UserUniverse {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId !: string;

    @Column({ name: 'universe_id', type: 'uuid' })
    universeId !: string;

    @Column({ name: 'is_active', type: 'boolean', default: false })
    isActive !: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt !: Date;

    @ManyToOne(() => User, (user) => user.userUniverses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Universe, (universe) => universe.userUniverses, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'universe_id' })
    universe!: Universe;
}