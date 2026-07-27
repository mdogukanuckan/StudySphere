import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [
        { email },
        { username },
      ],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [
        { email }
      ]
    });
  }

  create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    return this.userRepository.find().then((users) =>
      users.map(({ passwordHash, ...safeUser }) => safeUser),
    );
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`#${id} ID'li kullanıcı bulunamadı`);
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`#${id} ID'li kullanıcı bulunamadı`);
    }

    const { username, ...safeUpdateDto } = updateUserDto as UpdateUserDto & { username?: string };

    if (safeUpdateDto.email) {
      const conflictUser = await this.userRepository.findOne({
        where: { email: safeUpdateDto.email },
      });
      if (conflictUser && conflictUser.id !== id) {
        throw new ConflictException('Bu email zaten kullanılıyor');
      }
    }

    Object.assign(user, safeUpdateDto);
    const updatedUser = await this.userRepository.save(user);
    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, { passwordHash });
  }

  // "Arkadaşlarım" ekranındaki çevrimiçi/çevrimdışı durumu için (bkz.
  // FriendsService.computePresence) — mobil taraf uygulama ön plandayken
  // periyodik olarak bu ucu çağırıyor (bkz. useHeartbeat.ts). Hafif bir
  // update olduğu için tam entity'yi çekip save etmek yerine doğrudan
  // update() kullanılıyor.
  async touchLastActiveAt(id: string): Promise<void> {
    await this.userRepository.update(id, { lastActiveAt: new Date() });
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`#${id} ID'li kullanıcı bulunamadı`);
    }
    await this.userRepository.softRemove(user);
  }

}
