import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'TASK' | 'SYSTEM' | 'DISCORD';
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  channelType: 'WEB' | 'DISCORD' | 'EMAIL';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['TASK', 'SYSTEM', 'DISCORD'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    channelType: {
      type: String,
      enum: ['WEB', 'DISCORD', 'EMAIL'],
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index voor efficiënt zoeken
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ createdAt: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);