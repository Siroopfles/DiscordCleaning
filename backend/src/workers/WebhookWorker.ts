import logger from '../utils/logger';
import queueService, { QUEUES } from '../config/queue';
import webhookService from '../services/WebhookService';
import { IWebhookDelivery } from '../models/WebhookDelivery';

interface WebhookDeliveryMessage {
  webhookId: string;
  event: string;
  payload: any;
  deliveryId: string;
  retryCount: number;
}

class WebhookWorker {
  async start(): Promise<void> {
    try {
      await queueService.connect();
      
      // Handle main delivery queue
      await queueService.consumeFromQueue(
        QUEUES.WEBHOOK_DELIVERY,
        this.processDelivery.bind(this)
      );

      // Handle retry queue
      await queueService.consumeFromQueue(
        QUEUES.WEBHOOK_RETRY,
        this.processRetry.bind(this)
      );

      logger.info('WebhookWorker started successfully');
    } catch (error) {
      logger.error('Failed to start WebhookWorker:', error);
      throw error;
    }
  }

  private async processDelivery(message: WebhookDeliveryMessage): Promise<void> {
    const { webhookId, event, payload, deliveryId } = message;
    
    try {
      logger.info(`Processing webhook delivery ${deliveryId} for event ${event}`);
      await webhookService.processDelivery(webhookId, event, payload, deliveryId);
    } catch (error) {
      logger.error(`Failed to process webhook delivery ${deliveryId}:`, error);
      throw error; // Let the queue handler handle the retry logic
    }
  }

  private async processRetry(message: WebhookDeliveryMessage): Promise<void> {
    const { webhookId, event, payload, deliveryId, retryCount } = message;
    
    try {
      logger.info(`Processing webhook retry ${deliveryId} for event ${event} (attempt ${retryCount + 1})`);
      await webhookService.processDelivery(webhookId, event, payload, deliveryId, retryCount);
    } catch (error) {
      logger.error(`Failed to process webhook retry ${deliveryId}:`, error);
      
      // If max retries reached, move to dead letter queue
      if (retryCount >= 3) { // Max retries from WebhookConfiguration
        logger.warn(`Max retries reached for delivery ${deliveryId}, moving to dead letter queue`);
        throw error;
      }
      
      // Re-queue with incremented retry count after delay
      const nextRetry = new Date(Date.now() + Math.pow(5, retryCount + 1) * 1000);
      await queueService.publishToQueue(QUEUES.WEBHOOK_RETRY, {
        ...message,
        retryCount: retryCount + 1,
        nextRetry
      });
    }
  }

  async stop(): Promise<void> {
    try {
      await queueService.close();
      logger.info('WebhookWorker stopped successfully');
    } catch (error) {
      logger.error('Error stopping WebhookWorker:', error);
      throw error;
    }
  }
}

export default new WebhookWorker();