import { IAchievementProgress, AchievementProgress } from '../models/AchievementProgress';
import { IAchievementProgressRepository } from '../types/achievement';

export class AchievementProgressRepository implements IAchievementProgressRepository {
  async create(progress: Partial<IAchievementProgress>): Promise<IAchievementProgress> {
    return await AchievementProgress.create(progress);
  }

  async findById(id: string): Promise<IAchievementProgress | null> {
    return await AchievementProgress.findById(id);
  }

  async findByUserAndAchievement(userId: string, achievementId: string): Promise<IAchievementProgress | null> {
    return await AchievementProgress.findOne({
      userId,
      achievementId
    });
  }

  async findAllByUser(userId: string): Promise<IAchievementProgress[]> {
    return await AchievementProgress.find({ userId })
      .sort({ completedAt: -1, createdAt: -1 });
  }

  async update(id: string, progress: Partial<IAchievementProgress>): Promise<IAchievementProgress | null> {
    return await AchievementProgress.findByIdAndUpdate(
      id,
      { $set: progress },
      { new: true }
    );
  }

  async updateProgress(userId: string, achievementId: string, value: number): Promise<IAchievementProgress | null> {
    return await AchievementProgress.findOneAndUpdate(
      { userId, achievementId },
      {
        $inc: { progress: value },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    );
  }

  async updateStreak(userId: string, achievementId: string, reset: boolean = false): Promise<IAchievementProgress | null> {
    if (reset) {
      return await AchievementProgress.findOneAndUpdate(
        { userId, achievementId },
        {
          $set: {
            currentStreak: 0,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );
    }

    return await AchievementProgress.findOneAndUpdate(
      { userId, achievementId },
      {
        $inc: { currentStreak: 1 },
        $max: { maxStreak: { $add: ['$currentStreak', 1] } },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    );
  }

  async markAsCompleted(userId: string, achievementId: string): Promise<IAchievementProgress | null> {
    return await AchievementProgress.findOneAndUpdate(
      { userId, achievementId },
      {
        $set: {
          isCompleted: true,
          completedAt: new Date(),
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
  }

  async resetProgress(userId: string, achievementId: string): Promise<IAchievementProgress | null> {
    return await AchievementProgress.findOneAndUpdate(
      { userId, achievementId },
      {
        $set: {
          progress: 0,
          currentStreak: 0,
          maxStreak: 0,
          isCompleted: false,
          completedAt: null,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
  }
}