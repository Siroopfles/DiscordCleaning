import { Schema, model, Document } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  category: string;
  type: 'ONE_TIME' | 'PROGRESSIVE' | 'STREAK';
  requirements: {
    type: string;
    target: number;
    currentValue?: number;
  };
  rewards: {
    points: number;
    title?: string;
    badge?: string;
  };
  isHidden: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['TASKS', 'POINTS', 'SOCIAL', 'SPECIAL']
  },
  type: {
    type: String,
    required: true,
    enum: ['ONE_TIME', 'PROGRESSIVE', 'STREAK']
  },
  requirements: {
    type: {
      type: String,
      required: true,
      enum: ['TASK_COUNT', 'POINTS_EARNED', 'STREAK_LENGTH', 'SPECIAL_ACTION']
    },
    target: {
      type: Number,
      required: true,
      min: 1
    },
    currentValue: {
      type: Number,
      min: 0
    }
  },
  rewards: {
    points: {
      type: Number,
      required: true,
      min: 0
    },
    title: {
      type: String,
      maxlength: 50
    },
    badge: {
      type: String // URL of badge image
    }
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'achievements'
});

// Indexen voor snelle queries
AchievementSchema.index({ category: 1 });
AchievementSchema.index({ type: 1 });
AchievementSchema.index({ isHidden: 1 });
AchievementSchema.index({ order: 1 });

// Samengestelde indexen voor achievement lijsten
AchievementSchema.index({ 
  category: 1, 
  isHidden: 1, 
  order: 1 
});

export const Achievement = model<IAchievement>('Achievement', AchievementSchema);