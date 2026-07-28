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

    const isChangingEmail = !!safeUpdateDto.email && safeUpdateDto.email !== user.email;
    if (isChangingEmail) {
      user.isEmailVerified = false;
      user.emailVerificationCode = null;
      user.emailVerificationCodeExpiresAt = null;
      user.emailVerificationAttempts = 0;
      user.emailVerificationLastSentAt = null;
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

  async touchLastActiveAt(id: string): Promise<void> {
    await this.userRepository.update(id, { lastActiveAt: new Date() });
  }

  async getVerificationState(id: string): Promise<Pick<User,
    'id' | 'email' | 'isEmailVerified' | 'emailVerificationCode' |
    'emailVerificationCodeExpiresAt' | 'emailVerificationAttempts' | 'emailVerificationLastSentAt'
  >> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        emailVerificationCode: true,
        emailVerificationCodeExpiresAt: true,
        emailVerificationAttempts: true,
        emailVerificationLastSentAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`#${id} ID'li kullanıcı bulunamadı`);
    }
    return user;
  }

  async setEmailVerificationCode(id: string, codeHash: string, expiresAt: Date): Promise<void> {
    await this.userRepository.update(id, {
      emailVerificationCode: codeHash,
      emailVerificationCodeExpiresAt: expiresAt,
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: new Date(),
    });
  }

  async incrementVerificationAttempts(id: string): Promise<void> {
    await this.userRepository.increment({ id }, 'emailVerificationAttempts', 1);
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.userRepository.update(id, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
      emailVerificationAttempts: 0,
    });
  }

  async isEmailVerified(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id }, select: { id: true, isEmailVerified: true } });
    if (!user) {
      throw new NotFoundException(`#${id} ID'li kullanıcı bulunamadı`);
    }
    return user.isEmailVerified;
  }

  async setPasswordResetCode(id: string, codeHash: string, expiresAt: Date): Promise<void> {
    await this.userRepository.update(id, {
      passwordResetCode: codeHash,
      passwordResetCodeExpiresAt: expiresAt,
      passwordResetAttempts: 0,
      passwordResetLastSentAt: new Date(),
    });
  }

  async incrementPasswordResetAttempts(id: string): Promise<void> {
    await this.userRepository.increment({ id }, 'passwordResetAttempts', 1);
  }

  async resetPassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, {
      passwordHash,
      passwordResetCode: null,
      passwordResetCodeExpiresAt: null,
      passwordResetAttempts: 0,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`#${id} ID'li kullanıcı bulunamadı`);
    }
    await this.userRepository.softRemove(user);
  }

}
