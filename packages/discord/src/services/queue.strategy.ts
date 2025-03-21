import { Connection, Channel, connect } from 'amqplib';
import { TaskNotificationStrategy } from '../types/notification';
import { QueueConfig } from '../types/queue';
import { DiscordClient } from '../types';
import { TextChannel } from 'discord.js';
import { TaskNotification } from '../types/notification';

interface TaskNotificationWithChannel extends TaskNotification {
  channelId: string;
}

export class QueueNotificationStrategy implements TaskNotificationStrategy {
  private connection: any = null;
  private channel: any = null;

  constructor(private client: DiscordClient) {}

  async setupMessageQueue(config: QueueConfig): Promise<void> {
    try {
      // Maak verbinding met RabbitMQ
      this.connection = await (connect as any)(config.url);
      if (!this.connection) {
        throw new Error('Failed to create RabbitMQ connection');
      }

      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Setup queue en exchange
      const queueResult = await this.channel.assertQueue(config.queueName, { durable: true });
      const exchangeResult = await this.channel.assertExchange(config.exchangeName, 'topic', { durable: true });
      await this.channel.bindQueue(queueResult.queue, exchangeResult.exchange, '#');

      this.client.services.logger?.info('RabbitMQ connection established');

      // Setup message consumer
      await this.setupMessageConsumer(queueResult.queue);
    } catch (error) {
      this.client.services.logger?.error('Failed to setup RabbitMQ:', error);
      await this.closeConnection();
      throw error;
    }
  }

  private async setupMessageConsumer(queueName: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    const { consumerTag } = await this.channel.consume(queueName, async (msg: any) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as TaskNotification;
        await this.handleMessage(content);
        this.channel?.ack(msg);
      } catch (error) {
        this.client.services.logger?.error('Failed to process message:', error);
        // Negative acknowledge bij fouten
        if (this.channel) {
          this.channel.nack(msg, false, true);
        }
      }
    });

    this.client.services.logger?.info('Message consumer setup with tag:', consumerTag);
  }

  private async handleMessage(notification: TaskNotification): Promise<void> {
    if (!notification.taskId || !notification.taskTitle) {
      throw new Error('Invalid task notification format');
    }

    this.client.services.logger?.info('Processing task notification:', notification);

    // Verstuur notificatie naar Discord als er een channelId is
    const taskNotification = notification as TaskNotificationWithChannel;
    if (taskNotification.channelId) {
      const channel = await this.client.channels.fetch(taskNotification.channelId);
      if (channel instanceof TextChannel) {
        await channel.send({
          content: `Task ${notification.taskTitle} ${notification.action}`
        });
      }
    }
  }

  async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.client.services.logger?.info('RabbitMQ connection closed');
    } catch (error) {
      this.client.services.logger?.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  async send(notification: TaskNotification): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      const content = Buffer.from(JSON.stringify(notification));
      const routingKey = `task.${notification.action.toLowerCase()}`;
      const success = this.channel.publish('notifications', routingKey, content, {
        persistent: true,
        messageId: notification.id,
        timestamp: notification.timestamp.getTime(),
        type: notification.type
      });

      if (!success) {
        throw new Error('Failed to publish message');
      }

      this.client.services.logger?.debug('Task notification published:', {
        id: notification.id,
        type: notification.type,
        taskId: notification.taskId
      });
    } catch (error) {
      this.client.services.logger?.error('Failed to publish task notification:', error);
      throw error;
    }
  }
}