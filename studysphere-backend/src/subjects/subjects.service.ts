import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { Universe } from '../universes/entities/universe.entity';
import { UserUniverse } from '../universes/entities/user-universe.entity';

@Injectable()
export class SubjectsService {

  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository : Repository<Subject>,
    @InjectRepository(Universe)
    private readonly universeRepository : Repository<Universe>,
    @InjectRepository(UserUniverse)
    private readonly userUniverseRepository : Repository<UserUniverse>,
  ){}

  private async verifyUniverseOwnership(universeId: string, userId: string): Promise<Universe> {
    const link = await this.userUniverseRepository.findOne({
      where: { universeId, userId },
    });
    if (!link) {
      throw new NotFoundException('Belirtilen ID ile eşleşen bir evren bulunamadı.');
    }
    const universe = await this.universeRepository.findOne({ where: { id: universeId } });
    if (!universe) {
      throw new NotFoundException('Belirtilen ID ile eşleşen bir evren bulunamadı.');
    }
    return universe;
  }

  async create(createSubjectDto: CreateSubjectDto, userId: string): Promise<Subject> {
    const { name, description, universeId, targetDate, targetLabel } = createSubjectDto;

    // 1. Evrenin var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    const universe = await this.verifyUniverseOwnership(universeId, userId);

    // 2. Aynı evrende aynı isimde ders var mı kontrolü
    // isArchived: false — arşivlenmiş (eskiden "silinmiş") bir dersle aynı
    // isim artık çakışma sayılmıyor; kullanıcı aynı ismi yeniden kullanabilsin.
    const existingSubject = await this.subjectRepository.findOne({
      where: { name, universe: { id: universeId }, isArchived: false },
    });

    if (existingSubject) {
      throw new ConflictException('Bu evrende aynı isimde bir ders zaten mevcut.');
    }

    const newSubject = this.subjectRepository.create({
      name,
      description,
      universe,
      targetDate: targetDate ?? null,
      targetLabel: targetLabel ?? null,
    });

    return await this.subjectRepository.save(newSubject);
  }

  async findAll(userId: string, universeId?: string) : Promise<Subject[]> {
    if (universeId) {
      await this.verifyUniverseOwnership(universeId, userId);
      return await this.subjectRepository.find({
        // Arşivlenmiş dersler normal listede görünmemeli — bkz. remove().
        where: { universe: { id: universeId }, isArchived: false },
      });
    }
    return await this.subjectRepository
      .createQueryBuilder('subject')
      .innerJoin('user_universes', 'uu', 'uu.universe_id = subject.universe_id')
      .where('uu.user_id = :userId', { userId })
      .andWhere('subject.is_archived = false')
      .getMany();
  }

  async findOne(id : string, userId: string) : Promise<Subject>{
    const subject = await this.subjectRepository.findOne({where : {id }});
    if(!subject){
      throw new NotFoundException('Ders bulunamadı.');
    }
    await this.verifyUniverseOwnership(subject.universeId, userId);
    return subject;
  }

   async update(id: string, updateSubjectDto: UpdateSubjectDto, userId: string) : Promise<Subject>{
    const subject = await this.findOne(id, userId);
    Object.assign(subject,updateSubjectDto);
    return await this.subjectRepository.save(subject);
  }

  // Dönüş değeri: { archived: true } -> ders geçmiş kayıtlar yüzünden kalıcı
  // silinemedi, bunun yerine arşivlendi. { archived: false } -> gerçekten silindi.
  async remove(id: string, userId: string): Promise<{ archived: boolean }> {
    const subject = await this.findOne(id, userId);
    try {
      await this.subjectRepository.remove(subject);
      return { archived: false };
    } catch (error: any) {
      const isFkViolation = error?.code === '23503' || error?.driverError?.code === '23503';
      if (!isFkViolation) {
        throw error;
      }

      // Postgres, hangi tablonun engellediğini 'table' alanında bildiriyor.
      // Bunu iki farklı senaryoyu ayırt etmek için kullanıyoruz:
      const blockingTable = error?.table ?? error?.driverError?.table;

      if (blockingTable === 'topics') {
        // Ders hâlâ CANLI konular içeriyor (topics -> subject artık RESTRICT,
        // bkz. topic.entity.ts). Bu durumda Universe -> Subject ile aynı
        // mantığı istiyoruz: sessizce arşivlemek yerine kullanıcıyı açıkça
        // durdurup önce konuları silmesini/taşımasını istiyoruz. Aksi halde
        // hâlâ erişilmesi gereken konular, görünmez (arşivlenmiş) bir dersin
        // altında yetim kalırdı.
        throw new ConflictException(
          'Bu dersi silebilmek için önce içindeki konuları silmeli ya da başka bir derse taşımalısın.',
        );
      }

      // Konu kalmamış ama derse bağlı geçmiş çalışma seansları/odaları
      // (study_sessions/study_rooms) varsa, o geçmiş veriyi/istatistiği
      // kaybetmemek için dersi kalıcı silmek yerine arşivliyoruz.
      subject.isArchived = true;
      await this.subjectRepository.save(subject);
      return { archived: true };
    }
  }
}
