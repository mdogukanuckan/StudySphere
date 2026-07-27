import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, expiresInMs: number): Promise<{ token: string; entity: RefreshToken }> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInMs);

    const entity = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });
    const saved = await this.refreshTokenRepository.save(entity);
    return { token, entity: saved };
  }

  async findValidByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);
    const found = await this.refreshTokenRepository.findOne({ where: { tokenHash } });
    if (!found) return null;
    if (found.revokedAt) return null;
    if (found.expiresAt.getTime() < Date.now()) return null;
    return found;
  }

  async revoke(id: string): Promise<void> {
    await this.refreshTokenRepository.update(id, { revokedAt: new Date() });
  }

  async revokeByToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.refreshTokenRepository.update({ tokenHash }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
 async findActiveSessionsForUser(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.refreshTokenRepository.delete({ expiresAt: LessThan(new Date()) });
  }
}