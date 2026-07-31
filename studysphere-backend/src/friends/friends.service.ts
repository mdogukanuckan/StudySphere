import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';
import { User } from '../users/entities/user.entity';
import { SessionStatus, StudySession } from '../study-sessions/entities/study-session.entity';
import { UserStatisticsService } from '../user-statistics/user-statistics.service';
import { AchievementsService, UnlockedAchievement } from '../achievements/achievements.service';

export type FriendPresence = 'STUDYING' | 'ON_BREAK' | 'ONLINE' | 'OFFLINE';
export type UserRelationship = 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export interface FriendStats {
    totalStudyTime: number;
    totalSessionsCompleted: number;
    currentStreak: number;
    longestStreak: number;
}

const ONLINE_THRESHOLD_MINUTES = 5;

export interface SafeUser {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
}

@Injectable()
export class FriendsService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(StudySession)
        private readonly studySessionRepository: Repository<StudySession>,
        private readonly userStatisticsService: UserStatisticsService,
        private readonly achievementsService: AchievementsService,
    ) { }

    private toSafeUser(user: User): SafeUser {
        return {
            id: user.id,
            username: user.username,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
        };
    }

    private async findExistingRelationship(userAId: string, userBId: string): Promise<Friendship | null> {
        return this.friendshipRepository.findOne({
            where: [
                { requesterId: userAId, addresseeId: userBId },
                { requesterId: userBId, addresseeId: userAId },
            ],
        });
    }


    async searchUsers(currentUserId: string, query: string): Promise<Array<SafeUser & { relationship: UserRelationship }>> {
        const trimmed = (query ?? '').trim();
        if (trimmed.length < 2) return [];

        const users = await this.userRepository
            .createQueryBuilder('u')
            .where('u.id != :currentUserId', { currentUserId })
            .andWhere('u.username ILIKE :q', { q: `%${trimmed}%` })
            .take(20)
            .getMany();

        if (users.length === 0) return [];

        const relationships = await this.friendshipRepository.find({
            where: [
                { requesterId: currentUserId },
                { addresseeId: currentUserId },
            ],
        });

        return users.map((user) => {
            const rel = relationships.find(
                (r) => r.requesterId === user.id || r.addresseeId === user.id,
            );
            let relationship: UserRelationship = 'NONE';
            if (rel) {
                if (rel.status === FriendshipStatus.ACCEPTED) relationship = 'FRIENDS';
                else if (rel.requesterId === currentUserId) relationship = 'REQUEST_SENT';
                else relationship = 'REQUEST_RECEIVED';
            }
            return { ...this.toSafeUser(user), relationship };
        });
    }

    async sendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
        if (requesterId === addresseeId) {
            throw new BadRequestException('Kendine arkadaşlık isteği gönderemezsin.');
        }

        const addressee = await this.userRepository.findOne({ where: { id: addresseeId } });
        if (!addressee) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const existing = await this.findExistingRelationship(requesterId, addresseeId);
        if (existing) {
            if (existing.status === FriendshipStatus.ACCEPTED) {
                throw new ConflictException('Zaten arkadaşsınız.');
            }
            throw new ConflictException('Zaten bekleyen bir istek var.');
        }

        try {
            const request = this.friendshipRepository.create({
                requesterId,
                addresseeId,
                status: FriendshipStatus.PENDING,
            });
            return await this.friendshipRepository.save(request);
        } catch (error: any) {

            if (error?.code === '23505' || error?.driverError?.code === '23505') {
                throw new ConflictException('Zaten bekleyen bir istek var.');
            }
            throw error;
        }
    }

    private async findOwnedRequest(requestId: string, userId: string): Promise<Friendship> {
        const request = await this.friendshipRepository.findOne({ where: { id: requestId } });
        if (!request) {
            throw new NotFoundException('İstek bulunamadı.');
        }
        if (request.requesterId !== userId && request.addresseeId !== userId) {
            throw new ForbiddenException('Bu isteğe erişim yetkiniz yok.');
        }
        return request;
    }

    async acceptRequest(userId: string, requestId: string): Promise<Friendship & { newAchievements: UnlockedAchievement[] }> {
        const request = await this.findOwnedRequest(requestId, userId);
        if (request.addresseeId !== userId) {
            throw new ForbiddenException('Sadece isteği alan kişi kabul edebilir.');
        }
        if (request.status !== FriendshipStatus.PENDING) {
            throw new ConflictException('Bu istek zaten işleme alınmış.');
        }
        request.status = FriendshipStatus.ACCEPTED;
        const saved = await this.friendshipRepository.save(request);


        let newAchievements: UnlockedAchievement[] = [];
        try {
            const otherUserId = saved.requesterId === userId ? saved.addresseeId : saved.requesterId;
            const [mine] = await Promise.all([
                this.achievementsService.evaluateFriendAchievements(userId),
                this.achievementsService.evaluateFriendAchievements(otherUserId),
            ]);
            newAchievements = mine;
        } catch (error) {
            console.error('Arkadaşlık başarımları değerlendirilirken bir hata oluştu:', error);
        }

        return { ...saved, newAchievements };
    }


    async rejectOrCancelRequest(userId: string, requestId: string): Promise<void> {
        const request = await this.findOwnedRequest(requestId, userId);
        await this.friendshipRepository.remove(request);
    }

    async removeFriend(userId: string, friendUserId: string): Promise<void> {
        const relationship = await this.findExistingRelationship(userId, friendUserId);
        if (!relationship || relationship.status !== FriendshipStatus.ACCEPTED) {
            throw new NotFoundException('Böyle bir arkadaşlık bulunamadı.');
        }
        await this.friendshipRepository.remove(relationship);
    }

    async getPendingRequests(userId: string) {
        const requests = await this.friendshipRepository.find({
            where: [
                { addresseeId: userId, status: FriendshipStatus.PENDING },
                { requesterId: userId, status: FriendshipStatus.PENDING },
            ],
            relations: { requester: true, addressee: true },
            order: { createdAt: 'DESC' },
        });

        const incoming = requests
            .filter((r) => r.addresseeId === userId)
            .map((r) => ({ id: r.id, createdAt: r.createdAt, user: this.toSafeUser(r.requester) }));
        const outgoing = requests
            .filter((r) => r.requesterId === userId)
            .map((r) => ({ id: r.id, createdAt: r.createdAt, user: this.toSafeUser(r.addressee) }));

        return { incoming, outgoing };
    }

    private computePresence(user: User, activeSessionStatus: SessionStatus | null): FriendPresence {
        if (activeSessionStatus === SessionStatus.ACTIVE) return 'STUDYING';
        if (activeSessionStatus === SessionStatus.PAUSED) return 'ON_BREAK';
        if (user.lastActiveAt) {
            const minutesSinceActive = (Date.now() - new Date(user.lastActiveAt).getTime()) / 60000;
            if (minutesSinceActive <= ONLINE_THRESHOLD_MINUTES) return 'ONLINE';
        }
        return 'OFFLINE';
    }

    async getFriends(userId: string): Promise<Array<SafeUser & { presence: FriendPresence }>> {
        const relationships = await this.friendshipRepository.find({
            where: [
                { requesterId: userId, status: FriendshipStatus.ACCEPTED },
                { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
            ],
            relations: { requester: true, addressee: true },
        });

        if (relationships.length === 0) return [];

        const friendUsers = relationships.map((r) => (r.requesterId === userId ? r.addressee : r.requester));
        const friendIds = friendUsers.map((u) => u.id);


        const activeSessions = await this.studySessionRepository.find({
            where: { userId: In(friendIds), sessionStatus: In([SessionStatus.ACTIVE, SessionStatus.PAUSED]) },
            order: { updatedAt: 'DESC' },
        });
        const statusByUserId = new Map<string, SessionStatus>();
        for (const session of activeSessions) {
            if (!statusByUserId.has(session.userId)) {
                statusByUserId.set(session.userId, session.sessionStatus);
            }
        }

        return friendUsers.map((user) => ({
            ...this.toSafeUser(user),
            presence: this.computePresence(user, statusByUserId.get(user.id) ?? null),
        }));
    }

    async getFriendProfile(viewerId: string, friendUserId: string): Promise<{
        user: SafeUser;
        stats: FriendStats | null;
        achievements: Awaited<ReturnType<AchievementsService['getForUser']>>;
    }> {
        const relationship = await this.findExistingRelationship(viewerId, friendUserId);
        if (!relationship || relationship.status !== FriendshipStatus.ACCEPTED) {
            throw new ForbiddenException('Bu profili görüntüleyebilmek için arkadaş olmanız gerekiyor.');
        }

        const user = await this.userRepository.findOne({ where: { id: friendUserId } });
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const [statistic, achievements] = await Promise.all([
            this.userStatisticsService.getStatisticByUserId(friendUserId),
            this.achievementsService.getForUser(friendUserId),
        ]);

        const stats: FriendStats | null = statistic
            ? {
                totalStudyTime: statistic.totalStudyTime,
                totalSessionsCompleted: statistic.totalSessionsCompleted,
                currentStreak: statistic.currentStreak,
                longestStreak: statistic.longestStreak,
            }
            : null;

        return { user: this.toSafeUser(user), stats, achievements };
    }
}
