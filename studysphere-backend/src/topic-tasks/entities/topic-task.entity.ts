import { Topic } from "../../topics/entities/topic.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// "Konu bazlı görev/checklist" ("bu konudan şunları bitir") — her görev tek
// bir Topic'e bağlı, tamamlanma durumu basit bir boolean.
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

    // Görev bazlı not — Topic.notes (konunun genel notu) ile KARIŞTIRILMAMALI:
    // o tüm konu için tek bir serbest metin, bu ise her görevin KENDİ notu
    // (kullanıcı isteği: "her bir görev için ayrı ayrı not eklenebilmeli").
    @Column({ type: 'text', nullable: true })
    notes !: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt !: Date;

    // Bir görev, ait olduğu konudan bağımsız anlamlı değil (konunun "sahip
    // olduğu" basit metadata) — Universe->Subject/Subject->Topic'teki RESTRICT
    // deseninin aksine, burada konu silinince görevlerin de sessizce gitmesi
    // sürpriz olmaz, bu yüzden bilinçli olarak CASCADE seçildi.
    @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'topic_id' })
    topic !: Topic;
}
