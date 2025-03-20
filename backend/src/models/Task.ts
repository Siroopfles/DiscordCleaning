import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo: Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date;
  // Gamification uitbreidingen
  rewards: {
    basePoints: number;
    bonusPoints?: {
      amount: number;
      condition: string;
    };
    streakMultiplier: number;
  };
  completionStreak: number;
  lastCompletedInStreak?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    ref: 'Category'
  },
  priority: {
    type: String,
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    required: true,
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'TODO'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  rewards: {
    basePoints: {
      type: Number,
      required: true,
      default: 10,
      min: 0
    },
    bonusPoints: {
      amount: {
        type: Number,
        min: 0
      },
      condition: {
        type: String,
        enum: ['EARLY_COMPLETION', 'STREAK_MILESTONE', 'SPECIAL_EVENT']
      }
    },
    streakMultiplier: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 5
    }
  },
  completionStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCompletedInStreak: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'tasks'
});

// Indexen voor snelle queries
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ category: 1 });
TaskSchema.index({ dueDate: 1 }, { sparse: true });
TaskSchema.index({ completedAt: -1 }, { sparse: true });
TaskSchema.index({ completionStreak: -1 });

// Samengestelde index voor streak queries
TaskSchema.index({ 
  assignedTo: 1, 
  status: 1, 
  completionStreak: -1 
});

export const Task = model<ITask>('Task', TaskSchema);