import { EventEmitter } from 'events';
import { Document } from 'mongoose';
import { IAchievement } from '../models/Achievement';
import { AchievementService } from '../services/AchievementService';
import { PointsService } from '../services/PointsService';

type AchievementDocument = IAchievement & Document;

export class PointsEventSubscriber {
  private eventEmitter: EventEmitter;
  private achievementService: AchievementService;
  private pointsService: PointsService;

  constructor(
    eventEmitter: EventEmitter,
    achievementService: AchievementService,
    pointsService: PointsService
  ) {
    this.eventEmitter = eventEmitter;
    this.achievementService = achievementService;
    this.pointsService = pointsService;
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.eventEmitter.on('points:updated', this.handlePointsUpdated.bind(this));
    this.eventEmitter.on('points:reset', this.handlePointsReset.bind(this));
  }

  private async handlePointsUpdated(data: {
    userId: string;
    amount: number;
    newTotal: number;
    source: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Check for points-based achievements
    await this.checkPointsAchievements(data.userId, data.newTotal);

    // Check for task completion streaks if points came from task completion
    if (data.source === 'TASK_COMPLETION') {
      await this.checkTaskStreakAchievements(data.userId, data.metadata?.difficulty);
    }
  }

  private async handlePointsReset(data: { userId: string }): Promise<void> {
    // Reset progress on points-based achievements
    await this.achievementService.resetProgressByType(data.userId, 'POINTS_EARNED');
  }

  private async checkPointsAchievements(userId: string, totalPoints: number): Promise<void> {
    const pointsAchievements = await this.achievementService.getAchievementsByRequirementType('POINTS_EARNED') as AchievementDocument[];
    
    for (const achievement of pointsAchievements) {
      if (totalPoints >= achievement.requirements.target && achievement._id) {
        await this.achievementService.progressAchievement(userId, achievement._id.toString());
      }
    }
  }

  private async checkTaskStreakAchievements(userId: string, difficulty?: string): Promise<void> {
    if (!difficulty) return;

    const streakAchievements = await this.achievementService.getAchievementsByRequirementType('STREAK_LENGTH') as AchievementDocument[];
    
    // Only process achievements that match the task difficulty
    const relevantAchievements = streakAchievements.filter(achievement => {
      const requirementType = achievement.requirements.type;
      if (requirementType !== 'STREAK_LENGTH') return false;

      // For streaks, we might want different requirements based on task difficulty
      return achievement.type === 'STREAK' && (!achievement.category || achievement.category === difficulty);
    });

    for (const achievement of relevantAchievements) {
      if (!achievement._id) continue;
      await this.achievementService.progressAchievement(userId, achievement._id.toString());
    }
  }
}