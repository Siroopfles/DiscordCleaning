import { Types } from 'mongoose';
import { IAchievement } from '../models/Achievement';
import { IAchievementProgress } from '../models/AchievementProgress';
import { 
  IAchievementService, 
  IProgressUpdateData,
  AchievementEventType,
  AchievementEvent 
} from '../types/achievement';
import { AchievementRepository } from '../repositories/AchievementRepository';
import { AchievementProgressRepository } from '../repositories/AchievementProgressRepository';

export class AchievementService implements IAchievementService {
  private achievementRepo: AchievementRepository;
  private progressRepo: AchievementProgressRepository;

  constructor(
    achievementRepo: AchievementRepository,
    progressRepo: AchievementProgressRepository
  ) {
    this.achievementRepo = achievementRepo;
    this.progressRepo = progressRepo;
  }

  // Achievement CRUD operations
  async createAchievement(data: Partial<IAchievement>): Promise<IAchievement> {
    return await this.achievementRepo.create(data);
  }

  async getAchievement(id: string): Promise<IAchievement | null> {
    return await this.achievementRepo.findById(id);
  }

  async getAllAchievements(): Promise<IAchievement[]> {
    return await this.achievementRepo.findAll();
  }

  async getAchievementsByCategory(category: string): Promise<IAchievement[]> {
    return await this.achievementRepo.findByCategory(category);
  }

  async getAchievementsByRequirementType(type: string): Promise<IAchievement[]> {
    return await this.achievementRepo.findByRequirementType(type);
  }

  async resetProgressByType(userId: string, type: string): Promise<void> {
    const achievements = await this.getAchievementsByRequirementType(type);
    for (const achievement of achievements) {
      await this.progressRepo.resetProgress(userId, achievement._id.toString());
    }
  }

  async progressAchievement(userId: string, achievementId: string): Promise<void> {
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) return;

    await this.handleAchievementEvent({
      userId: new Types.ObjectId(userId),
      type: achievement.requirements.type as AchievementEventType,
      data: { value: achievement.requirements.target }
    });
  }

  async updateAchievement(id: string, data: Partial<IAchievement>): Promise<IAchievement | null> {
    return await this.achievementRepo.update(id, data);
  }

  async deleteAchievement(id: string): Promise<boolean> {
    return await this.achievementRepo.delete(id);
  }

  // Achievement progress operations
  async getUserProgress(userId: string): Promise<IAchievementProgress[]> {
    return await this.progressRepo.findAllByUser(userId);
  }

  async updateProgress(data: IProgressUpdateData): Promise<void> {
    const { userId, type, value } = data;
    
    // Haal achievements op die relevant zijn voor dit type update
    const relevantAchievements = await this.achievementRepo.findByRequirementType(type);
    
    // Expliciet type checking voor achievements
    const typedAchievements = relevantAchievements.filter((achievement): achievement is IAchievement => {
      if (!achievement || typeof achievement !== 'object') return false;
      
      const a = achievement as any;
      const hasValidId = a._id && a._id instanceof Types.ObjectId;
      const hasValidType = a.type && ['ONE_TIME', 'PROGRESSIVE', 'STREAK'].includes(a.type);
      const hasValidRequirements = a.requirements &&
        typeof a.requirements === 'object' &&
        typeof a.requirements.target === 'number';
      
      const isValid = hasValidId && hasValidType && hasValidRequirements;
      
      if (!isValid) {
        console.warn('Invalid achievement found:', achievement);
      }
      return isValid;
    });
    
    for (const achievement of typedAchievements) {
      const achievementId = (achievement._id as Types.ObjectId).toString();
      
      // Haal huidige voortgang op of maak nieuwe aan
      let progress = await this.progressRepo.findByUserAndAchievement(
        userId,
        achievementId
      );

      if (!progress) {
        progress = await this.progressRepo.create({
          userId: new Types.ObjectId(userId),
          achievementId: new Types.ObjectId(achievementId),
          progress: 0,
          currentStreak: 0,
          maxStreak: 0
        });
      }

      // Update voortgang op basis van achievement type
      switch (achievement.type) {
        case 'ONE_TIME':
          if (value >= achievement.requirements.target && !progress.isCompleted) {
            await this.markAchievementComplete(userId, achievementId);
          }
          break;

        case 'PROGRESSIVE':
          const newProgress = await this.progressRepo.updateProgress(
            userId,
            achievementId,
            value
          );
          
          if (newProgress && newProgress.progress >= achievement.requirements.target) {
            await this.markAchievementComplete(userId, achievementId);
          }
          break;

        case 'STREAK':
          if (type === 'STREAK_UPDATED') {
            // Voor streaks, value < 0 betekent reset
            const newStreak = await this.progressRepo.updateStreak(
              userId,
              achievementId,
              value < 0
            );
            
            if (newStreak && newStreak.currentStreak >= achievement.requirements.target) {
              await this.markAchievementComplete(userId, achievementId);
            }
          }
          break;
      }
    }
  }

  async checkAchievementCompletion(userId: string, achievementId: string): Promise<boolean> {
    const progress = await this.progressRepo.findByUserAndAchievement(userId, achievementId);
    return progress?.isCompleted ?? false;
  }

  // Event handler
  async handleAchievementEvent(event: AchievementEvent): Promise<void> {
    const { userId, type, data } = event;
    
    await this.updateProgress({
      userId: userId.toString(),
      type: type,
      value: data.value
    });
  }

  // Private helper methods
  private async markAchievementComplete(userId: string, achievementId: string): Promise<void> {
    await this.progressRepo.markAsCompleted(userId, achievementId);
    
    // Hier kunnen we events triggeren voor notificaties, punten toekennen, etc.
    const achievement = await this.achievementRepo.findById(achievementId);
    if (achievement) {
      // Event emitting logica hier toevoegen
      console.log(`Achievement completed: ${achievement.name} for user ${userId}`);
      // Reward processing logica hier toevoegen
    }
  }

  private isIAchievement(obj: any): obj is IAchievement {
    return obj &&
           typeof obj === 'object' &&
           '_id' in obj &&
           obj._id instanceof Types.ObjectId &&
           'type' in obj &&
           'requirements' in obj &&
           typeof obj.requirements === 'object' &&
           'target' in obj.requirements &&
           typeof obj.requirements.target === 'number';
  }
}