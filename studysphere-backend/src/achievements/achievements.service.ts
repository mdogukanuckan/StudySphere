import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { UserStatisticsService } from '../user-statistics/user-statistics.service';
import { UserStatistic } from '../user-statistics/entities/user-statistic.entity';
import { SessionStatus, StudySession } from '../study-sessions/entities/study-session.entity';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import { StudyRoom } from '../study-room/entities/study-room.entity';
import {
  ACHIEVEMENT_CATALOG,
  AchievementCategory,
  AchievementDefinition,
  ERRORLESS_SESSION_MIN_QUESTIONS,
  ERRORLESS_SESSION_MIN_SECONDS_PER_QUESTION,
} from './achievement.catalog';

export interface UnlockedAchievement extends AchievementDefinition {
  unlockedAt: Date;
}

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
   
    @InjectRepository(StudySession)
    private readonly studySessionRepository: Repository<StudySession>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
   
    @InjectRepository(StudyRoom)
    private readonly studyRoomRepository: Repository<StudyRoom>,
    private readonly userStatisticsService: UserStatisticsService,
  ) {}

  private isQualifyingErrorlessSession(session: StudySession): boolean {
    if (session.wrongCount !== 0) return false;
    if (session.questionCount < ERRORLESS_SESSION_MIN_QUESTIONS) return false;
    return session.durationSeconds >= session.questionCount * ERRORLESS_SESSION_MIN_SECONDS_PER_QUESTION;
  }

  private async getSocialStudySeconds(userId: string): Promise<number> {
    const { sum } = await this.studySessionRepository
      .createQueryBuilder('session')
      .select('SUM(session.durationSeconds)', 'sum')
      .where('session.userId = :userId', { userId })
      .andWhere('session.roomId IS NOT NULL')
      .andWhere('session.sessionStatus = :status', { status: SessionStatus.FINISHED })
      .getRawOne();
    return parseInt(sum, 10) || 0;
  }

  private async getFriendCount(userId: string): Promise<number> {
    return this.friendshipRepository.count({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });
  }

  private async getRoomsCreatedCount(userId: string): Promise<number> {
    return this.studyRoomRepository.count({ where: { ownerId: userId } });
  }

  
  private async getDistinctSubjectCount(userId: string): Promise<number> {
    const { count } = await this.studySessionRepository
      .createQueryBuilder('session')
      .select('COUNT(DISTINCT session.subjectId)', 'count')
      .where('session.userId = :userId', { userId })
      .andWhere('session.sessionStatus = :status', { status: SessionStatus.FINISHED })
      .getRawOne();
    return parseInt(count, 10) || 0;
  }

  private async buildProgressByCategory(userId: string, stats: UserStatistic): Promise<Record<AchievementCategory, number>> {
    const [socialStudySeconds, friendCount, roomsCreatedCount, distinctSubjectCount] = await Promise.all([
      this.getSocialStudySeconds(userId),
      this.getFriendCount(userId),
      this.getRoomsCreatedCount(userId),
      this.getDistinctSubjectCount(userId),
    ]);

    return {
      [AchievementCategory.TOTAL_QUESTIONS]: stats.totalCorrectQuestions + stats.totalIncorrectQuestions,
      [AchievementCategory.TOTAL_CORRECT]: stats.totalCorrectQuestions,
      [AchievementCategory.ERRORLESS_SESSIONS]: stats.cumulativeErrorlessSessions,
  
      [AchievementCategory.STUDY_TIME]: stats.totalStudyTime,
  
      [AchievementCategory.STREAK]: stats.longestStreak,
      [AchievementCategory.SOCIAL_STUDY_TIME]: socialStudySeconds,
      [AchievementCategory.FRIEND_COUNT]: friendCount,
      [AchievementCategory.ROOM_CREATION_COUNT]: roomsCreatedCount,
      [AchievementCategory.SUBJECT_DIVERSITY]: distinctSubjectCount,
    };
  }

  private async unlockNewlyQualified(
    userId: string,
    progressByCategory: Partial<Record<AchievementCategory, number>>,
  ): Promise<UnlockedAchievement[]> {
    const alreadyUnlocked = await this.userAchievementRepository.find({ where: { userId } });
    const unlockedKeys = new Set(alreadyUnlocked.map((a) => a.achievementKey));

    const newlyQualified = ACHIEVEMENT_CATALOG.filter((def) => {
      const progress = progressByCategory[def.category];
      return !unlockedKeys.has(def.key) && progress !== undefined && progress >= def.threshold;
    });

    if (newlyQualified.length === 0) return [];

    const result: UnlockedAchievement[] = [];
    for (const def of newlyQualified) {
      try {
        const entity = this.userAchievementRepository.create({ userId, achievementKey: def.key });
        const saved = await this.userAchievementRepository.save(entity);
        result.push({ ...def, unlockedAt: saved.unlockedAt });
      } catch (error: any) {
  
        if (error?.code !== '23505' && error?.driverError?.code !== '23505') {
          throw error;
        }
      }
    }
    return result;
  }

  async evaluateAndUnlock(userId: string, params: { stats: UserStatistic; session: StudySession }): Promise<UnlockedAchievement[]> {
    const { session } = params;
    let effectiveStats = params.stats;

    if (this.isQualifyingErrorlessSession(session)) {
  
      effectiveStats = await this.userStatisticsService.incrementErrorlessSessions(userId);
    }

    const progressByCategory = await this.buildProgressByCategory(userId, effectiveStats);
    return this.unlockNewlyQualified(userId, progressByCategory);
  }

  async evaluateFriendAchievements(userId: string): Promise<UnlockedAchievement[]> {
    const friendCount = await this.getFriendCount(userId);
    return this.unlockNewlyQualified(userId, { [AchievementCategory.FRIEND_COUNT]: friendCount });
  }

  async getForUser(userId: string) {
    const stats = await this.userStatisticsService.getStatisticByUserId(userId);
    const unlocked = await this.userAchievementRepository.find({ where: { userId } });
    const unlockedMap = new Map(unlocked.map((a) => [a.achievementKey, a.unlockedAt]));

    const progressByCategory = await this.buildProgressByCategory(userId, stats);

    return ACHIEVEMENT_CATALOG.map((def) => ({
      key: def.key,
      category: def.category,
      title: def.title,
      description: def.description,
      icon: def.icon,
      threshold: def.threshold,
      progress: Math.min(progressByCategory[def.category], def.threshold),
      target: def.threshold,
      unlocked: unlockedMap.has(def.key),
      unlockedAt: unlockedMap.get(def.key) ?? null,
    }));
  }
}
