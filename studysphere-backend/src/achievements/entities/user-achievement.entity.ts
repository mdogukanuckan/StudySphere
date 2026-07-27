import { User } from '../../users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_achievements')
@Index(['userId', 'achievementKey'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id !: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId !: string;

  @Column({ name: 'achievement_key', type: 'varchar', length: 100 })
  achievementKey !: string;

  @CreateDateColumn({ name: 'unlocked_at', type: 'timestamptz' })
  unlockedAt !: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user !: User;
}
