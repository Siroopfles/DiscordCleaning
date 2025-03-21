import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookConfiguration {
  name: string;
  url: string;
  secret: string;
  description?: string;
  enabled: boolean;
  events: string[];
  headers: Record<string, string>;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookConfiguration extends IWebhookConfiguration, Document {}

const webhookConfigurationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  secret: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  events: [{
    type: String,
    required: true
  }],
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  retryCount: {
    type: Number,
    default: 3,
    min: 0,
    max: 10
  }
}, {
  timestamps: true
});

export default mongoose.model<WebhookConfiguration>('WebhookConfiguration', webhookConfigurationSchema);