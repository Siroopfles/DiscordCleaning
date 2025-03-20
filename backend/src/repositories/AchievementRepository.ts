import { IAchievement, Achievement } from '../models/Achievement';
import { IAchievementRepository } from '../types/achievement';

export class AchievementRepository implements IAchievementRepository {
  async create(achievement: Partial<IAchievement>): Promise<IAchievement> {
    return await Achievement.create(achievement);
  }

  async findById(id: string): Promise<IAchievement | null> {
    return await Achievement.findById(id);
  }

  async findAll(): Promise<IAchievement[]> {
    return await Achievement.find()
      .sort({ order: 1, createdAt: -1 });
  }

  async findByCategory(category: string): Promise<IAchievement[]> {
    return await Achievement.find({ category })
      .sort({ order: 1, createdAt: -1 });
  }

  async findByRequirementType(type: string): Promise<IAchievement[]> {
    return await Achievement.find({
      'requirements.type': type
    }).sort({ order: 1, createdAt: -1 });
  }

  async update(id: string, achievement: Partial<IAchievement>): Promise<IAchievement | null> {
    return await Achievement.findByIdAndUpdate(
      id,
      { $set: achievement },
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await Achievement.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}