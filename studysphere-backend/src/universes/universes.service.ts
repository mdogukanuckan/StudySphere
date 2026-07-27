import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUniverseDto } from './dto/create-universe.dto';
import { UpdateUniverseDto } from './dto/update-universe.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Universe } from './entities/universe.entity';
import { Repository } from 'typeorm';
import { UserUniverse } from './entities/user-universe.entity';
import { Subject } from '../subjects/entities/subject.entity';

@Injectable()
export class UniversesService {

  constructor(
    @InjectRepository(Universe)
    private readonly universeRepository: Repository<Universe>,
    @InjectRepository(UserUniverse)
    private readonly userUniverseRepository: Repository<UserUniverse>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createUniverseDto: CreateUniverseDto, userId: string): Promise<Universe> {

    // isArchived: false — arşivlenmiş (eskiden "silinmiş") bir evrenle aynı
    // isim artık çakışma sayılmıyor; kullanıcı aynı ismi yeniden kullanabilsin.
    const existingUniverse = await this.universeRepository
      .createQueryBuilder('universe')
      .innerJoin('universe.userUniverses', 'uu')
      .where('uu.userId = :userId', { userId })
      .andWhere('universe.name = :name', { name: createUniverseDto.name })
      .andWhere('universe.isArchived = false')
      .getOne();

    if (existingUniverse) {
      throw new ConflictException('Bu isimde çalışma alanı bulunmakta');
    }

    const newUniverse = this.universeRepository.create(createUniverseDto);
    const savedUniverse = await this.universeRepository.save(newUniverse);

    const link = this.userUniverseRepository.create({
      userId,
      universeId: savedUniverse.id,
      isActive: true,
    });
    await this.userUniverseRepository.save(link);

    return savedUniverse;
  }

  async findAll(userId: string): Promise<Universe[]> {
    return await this.universeRepository
      .createQueryBuilder('universe')
      .innerJoin('universe.userUniverses', 'uu', 'uu.userId = :userId', { userId })
      // Arşivlenmiş evrenler normal listede görünmemeli; aynı şekilde bir
      // evrenin altına gömülü (join edilen) dersler listesinden de arşivlenmiş
      // dersler çıkarılıyor — bkz. remove().
      .where('universe.isArchived = false')
      .leftJoinAndSelect('universe.subjects', 'subjects', 'subjects.isArchived = false')
      .getMany();
  }

  private async verifyOwnership(universeId: string, userId: string): Promise<void> {
    const link = await this.userUniverseRepository.findOne({
      where: { universeId, userId },
    });
    if (!link) {
      throw new NotFoundException('Bu alan bulunamadı.');
    }
  }

  async findOne(id: string, userId: string): Promise<Universe> {
    await this.verifyOwnership(id, userId);
    const universe = await this.universeRepository.findOne({
      where: { id },
    });
    if (!universe) {
      throw new NotFoundException('Bu alan bulunamadı.');
    }
    return universe;
  }

  async update(id: string, updateUniverseDto: UpdateUniverseDto, userId: string): Promise<Universe> {
    const universe = await this.findOne(id, userId);
    Object.assign(universe, updateUniverseDto);
    return await this.universeRepository.save(universe);
  }

  // Dönüş değeri: { archived: true } -> evren geçmiş/arşivlenmiş kayıtlar
  // yüzünden kalıcı silinemedi, bunun yerine arşivlendi. { archived: false }
  // -> gerçekten silindi.
  async remove(id: string, userId: string): Promise<{ archived: boolean }> {
    const universe = await this.findOne(id, userId);
    try {
      await this.universeRepository.remove(universe);
      return { archived: false };
    } catch (error: any) {
      const isFkViolation = error?.code === '23503' || error?.driverError?.code === '23503';
      if (!isFkViolation) {
        throw error;
      }

      // Kullanıcı görünürdeki tüm dersleri silmiş/arşivlemiş olsa bile, bu
      // evren hâlâ silinemiyor olabilir — çünkü ARŞİVLENMİŞ bir ders (Subject
      // -> Universe RESTRICT ile) ya da evrene doğrudan bağlı geçmiş çalışma
      // seansı/odası hâlâ referans veriyor olabilir; bunlar kullanıcıya hiç
      // görünmüyor. Bu yüzden ham FK hatasının hangi tablodan geldiğine değil,
      // hâlâ CANLI (arşivlenmemiş) bir ders olup olmadığına bakıyoruz:
      const hasLiveSubject = (await this.subjectRepository.count({
        where: { universeId: id, isArchived: false },
      })) > 0;

      if (hasLiveSubject) {
        throw new ConflictException(
          'Bu evreni silebilmek için önce içindeki dersleri silmelisin.',
        );
      }

      // Görünürde hiç ders kalmadı; engelleyen şey ya arşivlenmiş (görünmez)
      // eski dersler ya da bu evrene doğrudan bağlı geçmiş çalışma seansları/
      // odaları. İkisi de kullanıcının artık erişmediği geçmiş veri olduğundan,
      // evreni kalıcı silmek yerine arşivliyoruz.
      universe.isArchived = true;
      await this.universeRepository.save(universe);
      return { archived: true };
    }
  }
}
