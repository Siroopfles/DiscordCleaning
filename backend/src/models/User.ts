import { Schema, model, Document } from 'mongoose';
import { IUser } from '../types/models';

export interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>({
  discord_id: {
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries by discord_id
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  settings: {
    notifications: {
      discord: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
      notificationTypes: {
        taskAssigned: {
          type: Boolean,
          default: true,
        },
        taskCompleted: {
          type: Boolean,
          default: true,
        },
        taskDue: {
          type: Boolean,
          default: true,
        },
        pointsEarned: {
          type: Boolean,
          default: true,
        },
      },
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark'],
    },
    language: {
      type: String,
      default: 'nl',
      enum: ['nl', 'en'],
    },
    taskManagement: {
      defaultView: {
        type: String,
        default: 'list',
        enum: ['list', 'kanban'],
      },
      defaultCategory: {
        type: String,
        required: false,
      },
      showCompletedTasks: {
        type: Boolean,
        default: true,
      },
      taskSortOrder: {
        type: String,
        default: 'dueDate',
        enum: ['dueDate', 'priority', 'createdAt'],
      },
    },
    gamification: {
      showLeaderboard: {
        type: Boolean,
        default: true,
      },
      showPointsHistory: {
        type: Boolean,
        default: true,
      },
      showAchievements: {
        type: Boolean,
        default: true,
      },
      notifyOnRewards: {
        type: Boolean,
        default: true,
      },
    },
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  versionKey: false, // Disable the version key (__v)
});

// Create indexes for common queries
userSchema.index({ username: 1 });

export const User = model<UserDocument>('User', userSchema);