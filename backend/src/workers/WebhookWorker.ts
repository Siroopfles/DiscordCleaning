import logger, { addWebhookContext } from '../utils/logger';
import queueService, { QUEUES } from '../config/queue';
import webhookService from '../services/WebhookService';
import { IWebhookDelivery } from '../models/WebhookDelivery';
import { webhookQueueSize } from '../config/webhookMetrics';

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
      logger.info('Processing webhook delivery', addWebhookContext({
        webhookId,
        eventType: event,
        deliveryId,
        status: 'processing'
      }));

      webhookQueueSize.labels('processing').inc();
      webhookQueueSize.labels('pending').dec();

      await webhookService.processDelivery(webhookId, event, payload, deliveryId);
    } catch (error) {
      // Queue size metrics are handled in WebhookService
      logger.error(`Failed to process webhook delivery ${deliveryId}:`, error);
      throw error; // Let the queue handler handle the retry logic
    }
  }

  private async processRetry(message: WebhookDeliveryMessage): Promise<void> {
    const { webhookId, event, payload, deliveryId, retryCount } = message;
    
    try {
      logger.info('Processing webhook retry', addWebhookContext({
        webhookId,
        eventType: event,
        deliveryId,
        retryCount: retryCount + 1,
        status: 'retrying'
      }));

      webhookQueueSize.labels('processing').inc();
      webhookQueueSize.labels('failed').dec();

      await webhookService.processDelivery(webhookId, event, payload, deliveryId, retryCount);
    } catch (error) {
      logger.error('Failed to process webhook retry', addWebhookContext({
        webhookId,
        eventType: event,
        deliveryId,
        retryCount: retryCount + 1,
        status: 'retry_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      
      // If max retries reached, move to dead letter queue
      if (retryCount >= 3) { // Max retries from WebhookConfiguration
        logger.warn('Max retries reached for webhook delivery', addWebhookContext({
          webhookId,
          eventType: event,
          deliveryId,
          retryCount,
          status: 'max_retries_reached'
        }));

        webhookQueueSize.labels('processing').dec();
        webhookQueueSize.labels('failed').inc();
        
        throw error;
      }
      
      // Re-queue with incremented retry count after delay
      const nextRetry = new Date(Date.now() + Math.pow(5, retryCount + 1) * 1000);
      
      webhookQueueSize.labels('processing').dec();
      webhookQueueSize.labels('failed').inc();
      
      await queueService.publishToQueue(QUEUES.WEBHOOK_RETRY, {
        ...message,
        retryCount: retryCount + 1,
        nextRetry
      });

      logger.info('Webhook retry scheduled', addWebhookContext({
        webhookId,
        eventType: event,
        deliveryId,
        retryCount: retryCount + 1,
        status: 'retry_scheduled'
      }));
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