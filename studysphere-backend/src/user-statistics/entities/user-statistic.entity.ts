import { User } from "../../users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_statistics')
export class UserStatistic {
  @PrimaryGeneratedColumn('uuid')
  id !: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user !: User;

  @Column({name:'total_study_time', type: 'int', default: 0 })
  totalStudyTime !: number; 

  @Column({name:'total_session_completed', type: 'int', default: 0 })
  totalSessionsCompleted !: number; 

  @Column({name:'current_streak', type: 'int', default: 0 })
  currentStreak !: number; 

  @Column({name: 'longest_streak', type: 'int', default: 0 })
  longestStreak!: number; 

  @Column({name :'total_correct_question' , type: 'int', default: 0 })
  totalCorrectQuestions !: number;

  @Column({name:'total_incorrect_question', type: 'int', default: 0 })
  totalIncorrectQuestions !: number;

  @Column({name:'last_study_date', type: 'timestamp', nullable: true })
  lastStudyDate !: Date;

  @Column({name:'cumulative_errorless_sessions', type: 'int', default: 0 })
  cumulativeErrorlessSessions !: number;

  @CreateDateColumn({name:'created_at'})
  createdAt !: Date;

  @UpdateDateColumn({name:'updated_at'})
  updatedAt !: Date;
}
