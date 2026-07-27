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
