import { Topic } from "../../topics/entities/topic.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('topic_tasks')
export class TopicTask {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'topic_id', type: 'uuid' })
    topicId !: string;

    @Column({ type: 'varchar', length: 200 })
    title !: string;

    @Column({ name: 'is_completed', type: 'boolean', default: false })
    isCompleted !: boolean;

    @Column({ type: 'text', nullable: true })
    notes !: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt !: Date;

    @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'topic_id' })
    topic !: Topic;
}
