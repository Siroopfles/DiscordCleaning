import { Schema, model, Document, Types } from 'mongoose';

export interface ITaskHistory extends Document {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  serverId: Types.ObjectId;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  timestamp: Date;
  previousState?: any;
  newState?: any;
  metadata?: {
    completionTime?: number;  // In milliseconds
    categoryId?: Types.ObjectId;
    priority?: string;
    assignedTo?: Types.ObjectId;
  };
}

const TaskHistorySchema = new Schema<ITaskHistory>({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serverId: {
    type: Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'completed', 'deleted'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  previousState: Schema.Types.Mixed,
  newState: Schema.Types.Mixed,
  metadata: {
    completionTime: Number,
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    priority: String,
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes voor efficiënte queries
TaskHistorySchema.index({ taskId: 1, timestamp: -1 });
TaskHistorySchema.index({ serverId: 1, timestamp: -1 });
TaskHistorySchema.index({ userId: 1, timestamp: -1 });

export const TaskHistory = model<ITaskHistory>('TaskHistory', TaskHistorySchema);