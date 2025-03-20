import { EventEmitter } from 'events';
import { PointsRepository } from '../repositories/PointsRepository';
import { PointsTransaction, PointSource, UserPoints } from '../types/points';
import { AchievementService } from './AchievementService';

export class PointsService {
  private eventEmitter: EventEmitter;
  private readonly pointsRepository: PointsRepository;
  private readonly achievementService: AchievementService;

  constructor(
    pointsRepository: PointsRepository,
    achievementService: AchievementService,
    eventEmitter: EventEmitter
  ) {
    this.pointsRepository = pointsRepository;
    this.achievementService = achievementService;
    this.eventEmitter = eventEmitter;
  }

  async processTransaction(transaction: PointsTransaction): Promise<void> {
    await this.pointsRepository.updatePoints(
      transaction.userId,
      transaction.amount,
      transaction.source
    );

    // Emit points updated event for achievement checking
    this.eventEmitter.emit('points:updated', {
      userId: transaction.userId,
      amount: transaction.amount,
      newTotal: (await this.getUserPoints(transaction.userId))?.total || 0,
      source: transaction.source,
      metadata: transaction.metadata
    });
  }

  async awardTaskPoints(userId: string, taskDifficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    const pointsMap = {
      easy: 10,
      medium: 20,
      hard: 30
    };

    await this.processTransaction({
      userId,
      amount: pointsMap[taskDifficulty],
      source: 'TASK_COMPLETION',
      metadata: { difficulty: taskDifficulty }
    });
  }

  async awardAchievementPoints(userId: string, achievementId: string): Promise<void> {
    const achievement = await this.achievementService.getAchievement(achievementId);
    if (!achievement) return;

    await this.processTransaction({
      userId,
      amount: achievement.rewards.points,
      source: 'ACHIEVEMENT_UNLOCK',
      metadata: { achievementId }
    });
  }

  async getUserPoints(userId: string): Promise<UserPoints | null> {
    return this.pointsRepository.getUserPoints(userId);
  }

  async getLeaderboard(limit: number = 10) {
    return this.pointsRepository.getTopUsers(limit);
  }

  async adjustPoints(userId: string, amount: number, reason: string): Promise<void> {
    await this.processTransaction({
      userId,
      amount,
      source: 'ADMIN_ADJUSTMENT',
      metadata: { reason }
    });
  }

  async resetPoints(userId: string): Promise<void> {
    await this.pointsRepository.resetPoints(userId);
    this.eventEmitter.emit('points:reset', { userId });
  }
}