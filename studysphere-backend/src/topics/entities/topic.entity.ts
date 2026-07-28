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

    @Column({type:'text', nullable: true})
    notes !: string | null;

    @CreateDateColumn({name:'created_at'})
    createdAt !: Date;

    @UpdateDateColumn({name:'updated_at'})
    updatedAt !: Date;

    @ManyToOne(() => Subject, (subject) => subject.topics, {onDelete: 'RESTRICT'})
    @JoinColumn({name :'subject_id'})
    subject !:Subject;
}
