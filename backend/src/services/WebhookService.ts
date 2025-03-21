import crypto from 'crypto';
import axios from 'axios';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import queueService, { QUEUES } from '../config/queue';
import { webhookRateLimiter } from '../middleware/rateLimiter';
import { 
  webhookDeliveryCounter, 
  webhookDeliveryDuration,
  webhookErrorCounter,
  webhookRetryCounter 
} from '../config/webhookMetrics';
import webhookConfigurationRepository, { IWebhookConfigurationRepository } from '../repositories/WebhookConfigurationRepository';
import webhookDeliveryRepository, { IWebhookDeliveryRepository } from '../repositories/WebhookDeliveryRepository';
import { IWebhookConfiguration, WebhookConfiguration } from '../models/WebhookConfiguration';
import { IWebhookDelivery, WebhookDelivery } from '../models/WebhookDelivery';

export class WebhookService {
  constructor(
    private webhookConfigRepo: IWebhookConfigurationRepository = webhookConfigurationRepository,
    private webhookDeliveryRepo: IWebhookDeliveryRepository = webhookDeliveryRepository
  ) {}

  private generateSignature(secret: string, payload: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private calculateNextRetry(retryCount: number): Date {
    // Exponential backoff: 5s, 25s, 125s
    const delay = Math.pow(5, retryCount + 1) * 1000;
    return new Date(Date.now() + delay);
  }

  async registerWebhook(data: Partial<IWebhookConfiguration>): Promise<WebhookConfiguration> {
    return await this.webhookConfigRepo.create(data);
  }

  async updateWebhook(id: string, data: Partial<IWebhookConfiguration>): Promise<WebhookConfiguration | null> {
    return await this.webhookConfigRepo.update(id, data);
  }

  async deleteWebhook(id: string): Promise<boolean> {
    return await this.webhookConfigRepo.delete(id);
  }

  async getWebhooksByEvent(event: string): Promise<WebhookConfiguration[]> {
    return await this.webhookConfigRepo.findByEvent(event);
  }

  async deliverWebhook(webhookId: string, event: string, payload: any): Promise<WebhookDelivery> {
    const webhook = await this.webhookConfigRepo.findById(webhookId);
    if (!webhook) {
      throw new Error(`Webhook configuration not found: ${webhookId}`);
    }

    const deliveryId = crypto.randomUUID();

    // Create initial delivery record
    const delivery = await this.webhookDeliveryRepo.create({
      webhookId: new Types.ObjectId(webhookId),
      event,
      payload,
      status: 'pending' as const,
      retryCount: 0,
      duration: 0
    });

    // Queue the webhook delivery
    await queueService.publishToQueue(QUEUES.WEBHOOK_DELIVERY, {
      webhookId,
      event,
      payload,
      deliveryId,
      retryCount: 0
    });

    return delivery;
  }

  async processDelivery(
    webhookId: string,
    event: string,
    payload: any,
    deliveryId: string,
    retryCount = 0
  ): Promise<void> {
    const webhook = await this.webhookConfigRepo.findById(webhookId);
    if (!webhook) {
      throw new Error(`Webhook configuration not found: ${webhookId}`);
    }

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(webhook.secret, payloadString);

    // Start delivery timer
    const endTimer = webhookDeliveryDuration.labels(event).startTimer();

    // Check rate limits before delivery
    const isLimited = await webhookRateLimiter.isRateLimited(webhook.url);
    if (isLimited) {
      logger.warn(`Rate limit exceeded for webhook ${webhookId} to ${webhook.url}`);
      throw new Error('Rate limit exceeded');
    }

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': webhookId,
          'X-Delivery-ID': deliveryId,
          'X-Hub-Signature': `sha256=${signature}`,
          'X-Event-Type': event,
          ...webhook.headers,
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '59', // TODO: Get actual remaining from Redis
          'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 60
        },
        timeout: 10000 // 10 second timeout
      });

      const duration = endTimer();

      // Update delivery status
      await this.webhookDeliveryRepo.updateDeliveryStatus(deliveryId, 'success', {
        statusCode: response.status,
        responseBody: JSON.stringify(response.data),
        duration
      });

      webhookDeliveryCounter.labels('success', event).inc();

    } catch (error: any) {
      const duration = endTimer();
      const isRetryable = this.isRetryableError(error);
      const isRateLimit = error.message === 'Rate limit exceeded' || error.response?.status === 429;

      // Update delivery status
      await this.webhookDeliveryRepo.updateDeliveryStatus(deliveryId, 'failed', {
        statusCode: error.response?.status || (isRateLimit ? 429 : 500),
        error: error.message,
        duration,
        retryCount,
        nextRetry: (isRetryable || isRateLimit) && retryCount < webhook.retryCount ?
          this.calculateNextRetry(retryCount) :
          undefined
      });

      // Track rate limit metrics
      if (isRateLimit) {
        webhookErrorCounter.labels('ratelimit', event).inc();
      }

      // Track error metrics
      // Track delivery metrics
      webhookDeliveryCounter.labels('failed', event).inc();
      webhookErrorCounter.labels(isRateLimit ? 'ratelimit' : this.categorizeError(error), event).inc();

      if ((isRetryable || isRateLimit) && retryCount < webhook.retryCount) {
        webhookRetryCounter.labels(event).inc();
      }

      throw error; // Let the queue handler manage retries
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, rate limits, and 5xx responses
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status === 429 || (status >= 500 && status <= 599);
  }

  private categorizeError(error: any): string {
    if (!error.response) return 'network';
    const status = error.response.status;
    if (status === 429) return 'ratelimit';
    if (status >= 500) return 'server';
    if (status === 404) return 'notfound';
    return 'other';
  }

  // Note: processRetries is now handled by the WebhookWorker through the retry queue

  async getDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    return await this.webhookDeliveryRepo.findByWebhookId(webhookId);
  }
}

export default new WebhookService();