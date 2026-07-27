import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RoomStatus } from "../enums/room-status.enum";
import { User } from "src/users/entities/user.entity";
import { Universe } from "src/universes/entities/universe.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Topic } from "src/topics/entities/topic.entity";
import { RoomParticipant } from "./room-participant.entity";

@Entity('study_rooms')
export class StudyRoom {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({type : 'varchar', length : 100})
    title !: string;

    @Column({type : 'text', nullable :true})
    description !: string;

    @Column({name : 'owner_id',type : 'uuid'})
    ownerId !: string;

    @Column({name : 'universe_id', type : 'uuid'})
    universeId !: string;

    @Column({name : 'subject_id', type: 'uuid'})
    subjectId !: string;

    @Column({name : 'topic_id', type:'uuid', nullable : true})
    topicId !: string;

    @Column({type : 'enum' , enum : RoomStatus, default : RoomStatus.ACTIVE})
    status !: RoomStatus;

    @Column({name : 'max_participants', type : 'int', default : 10})
    maxParticipants !: number;

    @Column({name : 'current_pariticipants', type : 'int', default :0})
    currentParticipants !: number;

    // Oda kapatıldığı an (closeRoom) burası dolduruluyor. Oda listesi
    // sorgusu (getRooms), kapanmasının üzerinden 1 saatten fazla geçmiş
    // kapalı odaları veritabanı seviyesinde eleyip hiç döndürmüyor
    // (bkz. study-room.service.ts#getRooms).
    // Aynı saat dilimi düzeltmesi burada da: 'timestamp' yerine 'timestamptz'
    // (bkz. study-sessions/entities/study-session.entity.ts ve
    // room-participant.entity.ts'teki aynı yorum — kök neden aynı).
    @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
    closedAt !: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt !: Date;

    @UpdateDateColumn({name : 'updated_at', type: 'timestamptz'})
    updatedAt !: Date;

    @ManyToOne(() => User)
    @JoinColumn({name : 'owner_id'})
    owner !: User;

    @ManyToOne(() => Universe)
    @JoinColumn({name : 'universe_id'})
    universe !: Universe;

    @ManyToOne(() => Subject)
    @JoinColumn({name : 'subject_id'})
    subject !: Subject;

    @ManyToOne(() => Topic,{nullable:true})
    @JoinColumn({name:'topic_id'})
    topic !: Topic;
    
    @OneToMany(() => RoomParticipant, (participant) => participant.room)
    participants !: RoomParticipant[];
}
