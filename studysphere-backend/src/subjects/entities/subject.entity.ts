import { Topic } from "../../topics/entities/topic.entity";
import { Universe } from "../../universes/entities/universe.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('subjects')
@Index(['universeId', 'name'], { unique: true, where: '"is_archived" = false' })
export class Subject {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'universe_id', type: 'uuid' })
    universeId !: string;

    @Column({ type: 'varchar', length: 100 })
    name !: string;

@Column({ type: 'text', nullable: true })
    description !: string;

    @Column({ name: 'is_archived', type: 'boolean', default: false })
    isArchived !: boolean;

    @Column({ name: 'target_date', type: 'date', nullable: true })
    targetDate !: string | null;

    @Column({ name: 'target_label', type: 'varchar', length: 100, nullable: true })
    targetLabel !: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt !: Date;

    @ManyToOne(() => Universe, (universe) => universe.subjects, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'universe_id' })
    universe !: Universe;

    @OneToMany(() => Topic, (topic) => topic.subject)
    topics !: Topic[];
}
