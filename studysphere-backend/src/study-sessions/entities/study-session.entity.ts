import { Universe } from "../../universes/entities/universe.entity";
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Subject } from "../../subjects/entities/subject.entity";
import { Topic } from "../../topics/entities/topic.entity";
import { StudyRoom } from "../../study-room/entities/study-room.entity";

export enum SessionType {
    POMODORO = 'POMODORO',
    FREE = 'FREE'
}

export enum SessionStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED'
}


@Entity('study_sessions')
export class StudySession {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'user_id', type: 'uuid' })
    @Index()
    userId !: string;

    @Column({ name: 'universe_id', type: 'uuid' })
    @Index()
    universeId !: string;

    @Column({ name: 'subject_id', type: 'uuid' })
    @Index()
    subjectId !: string;

    @Column({ name: 'topic_id', type: 'uuid', nullable: true })
    topicId !: string | null;

    // Seansın bir çalışma odası üzerinden mi (sosyal: oluşturma/katılma) yoksa
    // doğrudan konu seçilerek mi (solo) başlatıldığını ayırt etmek için.
    // Oda üzerinden başlatılan seanslarda doldurulur (bkz.
    // StudySessionsService.startSession). İstatistiklerdeki solo/sosyal kırılımı
    // bu alana göre yapılır: null => SOLO, dolu => SOCIAL.
    @Column({ name: 'room_id', type: 'uuid', nullable: true })
    @Index()
    roomId !: string | null;

    @Column({ name: 'goal', type: 'varchar', length: 255, nullable: true })
    goal !: string | null;

    // 'timestamp' (saat dilimsiz) yerine 'timestamptz' kullanıyoruz: Postgres bu
    // sütunu her zaman mutlak bir an (UTC) olarak saklar ve geri okurken hiçbir
    // saat dilimi varsayımına ihtiyaç duymaz. Önceki 'timestamp' türüyle, bu
    // değer Node sürecinin yerel saat dilimine (bu projede Türkiye, UTC+3) göre
    // yorumlanabiliyordu — bu da bir oda/kronometre az önce başlamışken bile
    // "3 saattir çalışıyor" gibi görünmesine yol açan kök nedendi (bkz.
    // RoomDetail/ActiveSessionWidget'taki "3 saat" hatası — mobil taraftaki
    // parseServerDate düzeltmesi yalnızca saat dilimi eksik gelen ham metinleri
    // kapsıyordu, sunucunun kendisinin yanlış yorumladığı bir değeri değil).
    @Column({ name: 'start_time', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    @Index()
    startTime !: Date;

    @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
    endTime !: Date | null;

    @Column({ name: 'duration_seconds', type: 'integer', default: 0 })
    durationSeconds !: number;

    // Kullanıcının Pomodoro seansı başlatırken seçtiği hedef süre (saniye).
    // Yalnızca POMODORO seanslarında doldurulur; FREE seanslarda null kalır.
    // Bu alandan önce oluşturulmuş eski seanslarda da null olur — mobil taraf
    // bu durumda 25 dakikaya (varsayılan) düşer (bkz. ActiveSessionWidget.tsx).
    @Column({ name: 'planned_duration_seconds', type: 'integer', nullable: true })
    plannedDurationSeconds !: number | null;

    @Column({ name: 'session_type', type: 'enum', enum: SessionType, default: SessionType.FREE })
    sessionType !: SessionType;

    @Column({ name: 'session_status', type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
    @Index()
    sessionStatus !: SessionStatus;

    @Column({name:'question_count', type:'integer', default:0})
    questionCount !: number;

    @Column({ name :'correct_count', type:'integer', default:0})
    correctCount !: number;

    @Column ({ name :'wrong_count' , type:'integer',default : 0})
    wrongCount !: number;

    @CreateDateColumn({name:'created_at', type: 'timestamptz'})
    createdAt !: Date;

    @UpdateDateColumn({name:'updated_at', type: 'timestamptz'})
    updatedAt !: Date;

    @ManyToOne(() => User,(user) => user.studySessions, {onDelete :'CASCADE'})
    @JoinColumn({name:'user_id'})
    user !: User;

    @ManyToOne(() => Universe,{onDelete : 'RESTRICT'})
    @JoinColumn({name :'universe_id'})
    universe !: Universe;

    @ManyToOne(() => Subject,{onDelete:'RESTRICT'})
    @JoinColumn({name:'subject_id'})
    subject !: Subject;

    @ManyToOne(() => Topic,{onDelete:'SET NULL',nullable:true})
    @JoinColumn({name:'topic_id'})
    topic !: Topic | null;

    @ManyToOne(() => StudyRoom, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'room_id' })
    room !: StudyRoom | null;

}