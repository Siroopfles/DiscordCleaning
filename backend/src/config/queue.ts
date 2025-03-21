import amqp, { Channel, Connection, ConsumeMessage, Options } from 'amqplib';
import logger from '../utils/logger';

export interface QueueConfig {
  name: string;
  options?: Options['AssertQueue'];
}

export const QUEUES = {
  WEBHOOK_DELIVERY: 'webhook.delivery',
  WEBHOOK_RETRY: 'webhook.retry'
} as const;

class QueueService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Setup error handlers
      this.connection.on('error', (err: Error) => {
        logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

      // Setup queues
      await this.setupQueues();
      
      logger.info('Successfully connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Main webhook delivery queue
    await this.channel.assertQueue(QUEUES.WEBHOOK_DELIVERY, {
      durable: true,
      deadLetterExchange: 'dlx',
      deadLetterRoutingKey: QUEUES.WEBHOOK_RETRY
    });

    // Retry queue for failed deliveries
    await this.channel.assertQueue(QUEUES.WEBHOOK_RETRY, {
      durable: true,
      messageTtl: 60000 // 1 minute default TTL
    });

    // Dead letter exchange for retries
    await this.channel.assertExchange('dlx', 'direct', { durable: true });
    await this.channel.bindQueue(QUEUES.WEBHOOK_RETRY, 'dlx', QUEUES.WEBHOOK_RETRY);
  }

  async publishToQueue(queue: string, data: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      return this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
        persistent: true,
        contentType: 'application/json'
      });
    } catch (error) {
      logger.error(`Error publishing to queue ${queue}:`, error);
      throw error;
    }
  }

  async consumeFromQueue(
    queue: string,
    handler: (data: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      await this.channel.consume(queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const data = JSON.parse(msg.content.toString());
          await handler(data);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error(`Error processing message from queue ${queue}:`, error);
          // Reject and requeue if it's a temporary failure
          if (this.channel && error instanceof Error) {
            this.channel.reject(msg, error.message.includes('temporary'));
          }
        }
      });
    } catch (error) {
      logger.error(`Error setting up consumer for queue ${queue}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
}

export default new QueueService();