import { BaseRepository, IBaseRepository } from './base.repository';
import WebhookDelivery, { WebhookDelivery as IWebhookDelivery } from '../models/WebhookDelivery';
import { FilterQuery } from 'mongoose';

export interface IWebhookDeliveryRepository extends IBaseRepository<IWebhookDelivery> {
  findPendingDeliveries(): Promise<IWebhookDelivery[]>;
  findByWebhookId(webhookId: string): Promise<IWebhookDelivery[]>;
  updateDeliveryStatus(id: string, status: 'success' | 'failed', data: Partial<IWebhookDelivery>): Promise<IWebhookDelivery | null>;
  findFailedDeliveriesForRetry(): Promise<IWebhookDelivery[]>;
}

export class WebhookDeliveryRepository extends BaseRepository<IWebhookDelivery> implements IWebhookDeliveryRepository {
  constructor() {
    super(WebhookDelivery);
  }

  async findPendingDeliveries(): Promise<IWebhookDelivery[]> {
    return await this.model.find({
      status: 'pending',
      nextRetry: { $lte: new Date() }
    }).exec();
  }

  async findByWebhookId(webhookId: string): Promise<IWebhookDelivery[]> {
    return await this.model.find({
      webhookId
    })
    .sort({ createdAt: -1 })
    .exec();
  }

  async updateDeliveryStatus(
    id: string, 
    status: 'success' | 'failed',
    data: Partial<IWebhookDelivery>
  ): Promise<IWebhookDelivery | null> {
    return await this.model.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          ...data
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  async findFailedDeliveriesForRetry(): Promise<IWebhookDelivery[]> {
    const filter: FilterQuery<IWebhookDelivery> = {
      status: 'failed',
      retryCount: { $lt: 3 }, // Max retries from WebhookConfiguration
      nextRetry: { $lte: new Date() }
    };

    return await this.model.find(filter)
      .sort({ nextRetry: 1 })
      .exec();
  }
}

export default new WebhookDeliveryRepository();