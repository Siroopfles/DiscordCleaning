import { Schema, model, Document, Types } from 'mongoose';

export interface IAchievementProgress extends Document {
  userId: Types.ObjectId;
  achievementId: Types.ObjectId;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
  currentStreak: number;
  maxStreak: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementProgressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false
  },
  completedAt: {
    type: Date
  },
  currentStreak: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  maxStreak: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'achievement_progress'
});

// Unieke index om dubbele voortgang te voorkomen
AchievementProgressSchema.index(
  { userId: 1, achievementId: 1 },
  { unique: true }
);

// Indexen voor snelle queries
AchievementProgressSchema.index({ userId: 1, isCompleted: 1 });
AchievementProgressSchema.index({ achievementId: 1, isCompleted: 1 });
AchievementProgressSchema.index({ completedAt: -1 });
AchievementProgressSchema.index({ currentStreak: -1 });

// Samengestelde index voor voortgangsoverzichten
AchievementProgressSchema.index({ 
  userId: 1, 
  isCompleted: 1, 
  completedAt: -1 
});

export const AchievementProgress = model<IAchievementProgress>('AchievementProgress', AchievementProgressSchema);