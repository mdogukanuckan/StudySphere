import { UserStatistic } from "../../user-statistics/entities/user-statistic.entity";
import { StudySession } from "../../study-sessions/entities/study-session.entity";
import { UserUniverse } from "../../universes/entities/user-universe.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RefreshToken } from "../../refresh-tokens/entities/refresh-token.entity";
import { Role } from "src/enums/role.enum";

export enum ExperienceMode {
    SOLO = 'SOLO',
    SOCIAL = 'SOCIAL'
}



@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email !: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    username !: string

    @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
    firstName !: string;

    @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
    lastName !: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash !: string;

    @Column({ name: 'experience_mode', type: 'enum', enum: ExperienceMode, default: ExperienceMode.SOLO })
    experienceMode !: ExperienceMode;

    @Column({ name: 'role', type: 'enum', enum: Role, default: Role.User })
    role !: Role;

    @Column({ name: 'last_active_at', type: 'timestamp', nullable: true })
    lastActiveAt !: Date

    @Column({ name: 'is_email_verified', type: 'boolean', default: false })
    isEmailVerified !: boolean;

    @Column({ name: 'email_verification_code', type: 'varchar', length: 255, nullable: true })
    emailVerificationCode !: string | null;

    @Column({ name: 'email_verification_code_expires_at', type: 'timestamp', nullable: true })
    emailVerificationCodeExpiresAt !: Date | null;

    @Column({ name: 'email_verification_attempts', type: 'int', default: 0 })
    emailVerificationAttempts !: number;

    @Column({ name: 'email_verification_last_sent_at', type: 'timestamp', nullable: true })
    emailVerificationLastSentAt !: Date | null

    @Column({ name: 'password_reset_code', type: 'varchar', length: 255, nullable: true })
    passwordResetCode !: string | null;

    @Column({ name: 'password_reset_code_expires_at', type: 'timestamp', nullable: true })
    passwordResetCodeExpiresAt !: Date | null;

    @Column({ name: 'password_reset_attempts', type: 'int', default: 0 })
    passwordResetAttempts !: number;

    @Column({ name: 'password_reset_last_sent_at', type: 'timestamp', nullable: true })
    passwordResetLastSentAt !: Date | null

    @Column({ name: 'weekly_summary_email_enabled', type: 'boolean', default: false })
    weeklySummaryEmailEnabled !: boolean;

    @Column({ name: 'monthly_summary_email_enabled', type: 'boolean', default: false })
    monthlySummaryEmailEnabled !: boolean;

    @Column({ name: 'join_by_code_failed_attempts', type: 'int', default: 0 })
    joinByCodeFailedAttempts !: number;

    @Column({ name: 'join_by_code_locked_until', type: 'timestamp', nullable: true })
    joinByCodeLockedUntil !: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt !: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt !: Date;

    @OneToMany(() => UserUniverse, (userUniverse) => userUniverse.user)
    userUniverses!: UserUniverse[];

    @OneToMany(() => StudySession,(studySession) => studySession.user)
    studySessions !: StudySession[];

    @OneToOne(() => UserStatistic, (userStatistic) => userStatistic.user)
    userStatistics !: UserStatistic;

    @OneToMany(() => RefreshToken,(refreshToken) => refreshToken.user)
    refreshTokens !: RefreshToken[];
}
