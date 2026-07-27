import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserUniverse } from "./user-universe.entity";
import { Subject } from "../../subjects/entities/subject.entity";

@Entity('universes')
export class Universe {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ name: 'name', type: 'varchar' })
    name !: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description !: string;

    // Bir evrenin kalıcı silinmesi, hâlâ arşivlenmiş (görünmez) dersler ya da
    // geçmiş çalışma seansları/odaları yüzünden FK kısıtlamasına takılırsa
    // (bkz. UniversesService.remove), evreni veritabanından silmek yerine
    // burada arşivli işaretliyoruz — Subject'teki aynı desen (subject.entity.ts).
    @Column({ name: 'is_archived', type: 'boolean', default: false })
    isArchived !: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt !: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt !: Date;

    @OneToMany(() => UserUniverse, (userUniverse) => userUniverse.universe)
    userUniverses !: UserUniverse[];

    @OneToMany(() => Subject, (subject) => subject.universe)
    subjects !: Subject[];
}
