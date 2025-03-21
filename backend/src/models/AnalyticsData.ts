import { Schema, model, Document, Types } from 'mongoose';

export interface IAnalyticsData extends Document {
  serverId: Types.ObjectId;
  timeframe: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;  // In milliseconds
    tasksByCategory: Array<{
      categoryId: Types.ObjectId;
      count: number;
      completedCount: number;
    }>;
    tasksByUser: Array<{
      userId: Types.ObjectId;
      count: number;
      completedCount: number;
      averageCompletionTime: number;
    }>;
    tasksByPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  aggregatedAt: Date;
}

const AnalyticsDataSchema = new Schema<IAnalyticsData>({
  serverId: {
    type: Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
    index: true
  },
  timeframe: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    totalTasks: {
      type: Number,
      required: true,
      default: 0
    },
    completedTasks: {
      type: Number,
      required: true,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      required: true,
      default: 0
    },
    tasksByCategory: [{
      categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
      },
      count: {
        type: Number,
        required: true,
        default: 0
      },
      completedCount: {
        type: Number,
        required: true,
        default: 0
      }
    }],
    tasksByUser: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      count: {
        type: Number,
        required: true,
        default: 0
      },
      completedCount: {
        type: Number,
        required: true,
        default: 0
      },
      averageCompletionTime: {
        type: Number,
        required: true,
        default: 0
      }
    }],
    tasksByPriority: {
      high: {
        type: Number,
        required: true,
        default: 0
      },
      medium: {
        type: Number,
        required: true,
        default: 0
      },
      low: {
        type: Number,
        required: true,
        default: 0
      }
    }
  },
  aggregatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Indexes voor efficiënte queries
AnalyticsDataSchema.index({ serverId: 1, timeframe: 1, date: -1 });
AnalyticsDataSchema.index({ serverId: 1, date: -1 });

export const AnalyticsData = model<IAnalyticsData>('AnalyticsData', AnalyticsDataSchema);