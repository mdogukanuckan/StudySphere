import { Subject } from "../../subjects/entities/subject.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('topics')
@Index(['subjectId','name'],{unique:true})
export class Topic {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({name:'subject_id',type:'uuid'})
    subjectId !: string;

    @Column({type:'varchar',length:100})
    name !: string;

    // "Konuya bağlı not alma" — serbest metin, opsiyonel.
    @Column({type:'text', nullable: true})
    notes !: string | null;

    @CreateDateColumn({name:'created_at'})
    createdAt !: Date;

    @UpdateDateColumn({name:'updated_at'})
    updatedAt !: Date;

    // Önceden CASCADE'di: bir ders silinince içindeki konular da sessizce
    // (kullanıcıya hiç sorulmadan) siliniyordu. Artık Subject -> Universe
    // ilişkisiyle aynı mantık: bir dersin içinde hâlâ konular varsa, dersin
    // silinmesi engelleniyor (bkz. SubjectsService.remove — bu durumu 'topics'
    // tablosundan gelen FK ihlali olarak ayırt edip kullanıcıya açıkça
    // bildiriyor, konuları arşivlemiyor/silmiyor).
    @ManyToOne(() => Subject, (subject) => subject.topics, {onDelete: 'RESTRICT'})
    @JoinColumn({name :'subject_id'})
    subject !:Subject;
}
