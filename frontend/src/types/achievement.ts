export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  requirementType: string;
  requiredValue: number;
  points: number;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  currentValue: number;
  completed: boolean;
  currentStreak: number;
  lastUpdated: Date;
}

export enum AchievementEventType {
  TASK_COMPLETED = 'TASK_COMPLETED',
  POINTS_EARNED = 'POINTS_EARNED',
  STREAK_UPDATED = 'STREAK_UPDATED',
  SPECIAL_ACTION = 'SPECIAL_ACTION'
}

export interface AchievementEvent {
  type: AchievementEventType;
  userId: string;
  data: {
    value: number;
    [key: string]: any;
  };
}