export type PointSource = 'TASK_COMPLETION' | 'ACHIEVEMENT_UNLOCK' | 'ADMIN_ADJUSTMENT';

export interface PointsTransaction {
  userId: string;
  amount: number;
  source: PointSource;
  metadata?: Record<string, any>;
}

export interface PointsHistory {
  amount: number;
  source: PointSource;
  timestamp: Date;
}

export interface UserPoints {
  current: number;
  total: number;
  history: PointsHistory[];
}