import { Topic } from "../../topics/entities/topic.entity";
import { Universe } from "../../universes/entities/universe.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('subjects')
// Not: bu eskiden koşulsuz bir unique index'ti. Artık arşivlenmiş (isArchived)
// dersler veritabanında satır olarak kaldığından, bu index'i sadece
// arşivlenmemiş derslere uygulanan kısmi (partial) bir index'e çevirdik —
// aksi halde bir ders arşivlendikten sonra aynı isimle yeni bir ders
// oluşturmak, ORM seviyesindeki kontrolden geçse bile DB'nin unique
// kısıtlamasına çarpardı. (RoomParticipant'taki kısmi index ile aynı desen.)
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

    // Bir dersin kalıcı silinmesi, ona ait geçmiş çalışma seansları/odaları
    // yüzünden FK kısıtlamasına takılırsa (bkz. SubjectsService.remove),
    // dersi veritabanından silmek yerine burada arşivli işaretliyoruz: normal
    // listelerden kaybolur ama geçmiş seans/istatistik verisi bozulmaz.
    @Column({ name: 'is_archived', type: 'boolean', default: false })
    isArchived !: boolean;

    // "Sınav/hedef tarihi geri sayımı" — exam'ler genelde tek bir konudan değil
    // tüm dersten sorulduğu için Topic yerine bilinçli olarak Subject seviyesine
    // eklendi. İkisi de opsiyonel: bir dersin hedef tarihi olmayabilir.
    @Column({ name: 'target_date', type: 'date', nullable: true })
    targetDate !: string | null;

    // Ör. "Vize", "Final", "Bütünleme" — tarihin ne için olduğunu açıklayan
    // serbest metin etiket.
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
