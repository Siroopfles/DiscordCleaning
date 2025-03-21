import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookDelivery {
  webhookId: mongoose.Types.ObjectId;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  responseBody?: string;
  error?: string;
  retryCount: number;
  nextRetry?: Date;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery extends IWebhookDelivery, Document {}

const webhookDeliverySchema = new Schema({
  webhookId: {
    type: Schema.Types.ObjectId,
    ref: 'WebhookConfiguration',
    required: true
  },
  event: {
    type: String,
    required: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  statusCode: {
    type: Number
  },
  responseBody: {
    type: String
  },
  error: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  nextRetry: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying of pending deliveries and retries
webhookDeliverySchema.index({ status: 1, nextRetry: 1 });
webhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });

export default mongoose.model<WebhookDelivery>('WebhookDelivery', webhookDeliverySchema);