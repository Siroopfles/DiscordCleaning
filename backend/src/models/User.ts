import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  discord_id: string;
  username: string;
  points: number;
  totalPoints: number;
  // Points history voor tracking en analyses
  pointsHistory: Array<{
    amount: number;
    source: string;
    timestamp: Date;
  }>;
  // Cached achievements data voor snelle queries
  achievementStats: {
    total: number;
    completed: number;
    lastCompletedAt?: Date;
  };
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
    privacy: {
      showInLeaderboard: boolean;
      shareActivity: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  discord_id: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  pointsHistory: [{
    amount: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      required: true,
      enum: ['TASK_COMPLETION', 'ACHIEVEMENT_UNLOCK', 'ADMIN_ADJUSTMENT']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  achievementStats: {
    total: {
      type: Number,
      required: true,
      default: 0
    },
    completed: {
      type: Number,
      required: true,
      default: 0
    },
    lastCompletedAt: {
      type: Date
    }
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'nl'
    },
    privacy: {
      showInLeaderboard: {
        type: Boolean,
        default: true
      },
      shareActivity: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexen voor snelle queries
UserSchema.index({ discord_id: 1 }, { unique: true });
UserSchema.index({ points: -1 });
UserSchema.index({ 'achievementStats.completed': -1 });
UserSchema.index({ 'settings.privacy.showInLeaderboard': 1 });

export const User = model<IUser>('User', UserSchema);