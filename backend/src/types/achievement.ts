import { Types } from 'mongoose';
import { IAchievement } from '../models/Achievement';
import { IAchievementProgress } from '../models/AchievementProgress';

// Repository interfaces
export interface IAchievementRepository {
  create(achievement: Partial<IAchievement>): Promise<IAchievement>;
  findById(id: string): Promise<IAchievement | null>;
  findAll(): Promise<IAchievement[]>;
  findByCategory(category: string): Promise<IAchievement[]>;
  update(id: string, achievement: Partial<IAchievement>): Promise<IAchievement | null>;
  delete(id: string): Promise<boolean>;
  findByRequirementType(type: string): Promise<IAchievement[]>;
}

export interface IAchievementProgressRepository {
  create(progress: Partial<IAchievementProgress>): Promise<IAchievementProgress>;
  findById(id: string): Promise<IAchievementProgress | null>;
  findByUserAndAchievement(userId: string, achievementId: string): Promise<IAchievementProgress | null>;
  findAllByUser(userId: string): Promise<IAchievementProgress[]>;
  update(id: string, progress: Partial<IAchievementProgress>): Promise<IAchievementProgress | null>;
  updateProgress(userId: string, achievementId: string, value: number): Promise<IAchievementProgress | null>;
  updateStreak(userId: string, achievementId: string, reset?: boolean): Promise<IAchievementProgress | null>;
  markAsCompleted(userId: string, achievementId: string): Promise<IAchievementProgress | null>;
  resetProgress(userId: string, achievementId: string): Promise<IAchievementProgress | null>;
}

// Service interfaces
export interface IProgressUpdateData {
  userId: string;
  type: string;
  value: number;
}

export interface IAchievementService {
  createAchievement(data: Partial<IAchievement>): Promise<IAchievement>;
  getAchievement(id: string): Promise<IAchievement | null>;
  getAllAchievements(): Promise<IAchievement[]>;
  getAchievementsByCategory(category: string): Promise<IAchievement[]>;
  updateAchievement(id: string, data: Partial<IAchievement>): Promise<IAchievement | null>;
  deleteAchievement(id: string): Promise<boolean>;
  getAchievementsByRequirementType(type: string): Promise<IAchievement[]>;
  resetProgressByType(userId: string, type: string): Promise<void>;
  progressAchievement(userId: string, achievementId: string): Promise<void>;
  
  getUserProgress(userId: string): Promise<IAchievementProgress[]>;
  updateProgress(data: IProgressUpdateData): Promise<void>;
  checkAchievementCompletion(userId: string, achievementId: string): Promise<boolean>;
}

// Event types
export enum AchievementEventType {
  TASK_COMPLETED = 'TASK_COMPLETED',
  POINTS_EARNED = 'POINTS_EARNED',
  STREAK_UPDATED = 'STREAK_UPDATED',
  SPECIAL_ACTION = 'SPECIAL_ACTION'
}

export interface AchievementEvent {
  type: AchievementEventType;
  userId: Types.ObjectId | string;
  data: {
    value: number;
    [key: string]: any;
  };
}