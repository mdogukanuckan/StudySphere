import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UpdateUserStatisticDto } from './dto/update-user-statistic.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserStatistic } from './entities/user-statistic.entity';
import { DataSource, Repository } from 'typeorm';
import { StudySessionsService } from '../study-sessions/study-sessions.service';

@Injectable()
export class UserStatisticsService {

  constructor(

    @InjectRepository(UserStatistic)
    private readonly userStatisticsRepository : Repository<UserStatistic>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => StudySessionsService))
    private readonly studySessionsService: StudySessionsService,
  ){}

  async createDefaultStatistic(userId : string) : Promise<UserStatistic>{
    try {
      const newStatistic = this.userStatisticsRepository.create({
        user : {id : userId}
      });
      return await this.userStatisticsRepository.save(newStatistic);
    } catch (error) {
      if (!!error && typeof error === 'object' && (error as { code?: string }).code === '23505') {
        const existing = await this.userStatisticsRepository.findOne({ where: { user: { id: userId } } });
        if (existing) return existing;
      }
      throw error;
    }
  }

  async getStatisticByUserId(userId : string) : Promise<UserStatistic>{
    let statistic = await this.userStatisticsRepository.findOne({
      where: {user : {id : userId}}
    });
    if(!statistic){
      statistic = await this.createDefaultStatistic(userId);
    }
    return statistic;
  }


  async updateStatistic(userId: string, updateDto: UpdateUserStatisticDto): Promise<UserStatistic> {

    await this.getStatisticByUserId(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stats = await queryRunner.manager
        .createQueryBuilder(UserStatistic, 'stats')
        .setLock('pessimistic_write')
        .where('stats.user_id = :userId', { userId })
        .getOne();

      if (!stats) {
        throw new Error(`#${userId} kullanıcısı için istatistik satırı bulunamadı.`);
      }

      if (updateDto.durationSeconds) stats.totalStudyTime += updateDto.durationSeconds;
      if (updateDto.correctQuestions) stats.totalCorrectQuestions += updateDto.correctQuestions;
      if (updateDto.incorrectQuestions) stats.totalIncorrectQuestions += updateDto.incorrectQuestions;

      stats.totalSessionsCompleted += 1;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (!stats.lastStudyDate) {
        stats.currentStreak += 1;
        stats.longestStreak += 1;
        stats.lastStudyDate = now;
      } else {
        const lastDate = new Date(stats.lastStudyDate);
        const lastStudyDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

        const diffTime = Math.abs(today.getTime() - lastStudyDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          stats.currentStreak += 1;
          if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
          }
          stats.lastStudyDate = now;
        } else if (diffDays > 1) {
          stats.currentStreak = 1;
          stats.lastStudyDate = now;
        } else if (diffDays === 0) {
          stats.lastStudyDate = now;
        }
      }

      const saved = await queryRunner.manager.save(stats);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // Başarımlar: kümülatif "hatasız seans" sayacını 1 artırır. updateStatistic()
  // ile aynı pessimistic_write kilit deseni — AchievementsService.evaluateAndUnlock()
  // tarafından, yalnızca suistimal kontrolünden geçen seanslar için çağrılır
  // (bkz. achievements/achievement.catalog.ts).
  async incrementErrorlessSessions(userId: string): Promise<UserStatistic> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stats = await queryRunner.manager
        .createQueryBuilder(UserStatistic, 'stats')
        .setLock('pessimistic_write')
        .where('stats.user_id = :userId', { userId })
        .getOne();

      if (!stats) {
        throw new Error(`#${userId} kullanıcısı için istatistik satırı bulunamadı.`);
      }

      stats.cumulativeErrorlessSessions += 1;

      const saved = await queryRunner.manager.save(stats);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

async getStatisticsBySubject(userId: string) {
  return await this.userStatisticsRepository.createQueryBuilder('stats')
    .leftJoin('stats.user', 'user')
    .select('session.subjectId', 'subjectId')
    .addSelect('SUM(session.durationSeconds)', 'totalDuration')
    .leftJoin('StudySession', 'session', 'session.userId = user.id')
    .groupBy('session.subjectId')
    .getRawMany();
}

async getDailyStudyStats(userId: string) {
    return await this.studySessionsService.getDailyStats(userId);
  }
}
