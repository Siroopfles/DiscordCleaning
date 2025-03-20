import { Channel } from 'amqplib';
import rabbitmqConfig from '../config/rabbitmq';
import notificationRepository from '../repositories/notification.repository';
import { INotification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';

export class NotificationService {
  private channel: Channel | null = null;

  async initialize(): Promise<void> {
    await rabbitmqConfig.initialize();
    this.channel = rabbitmqConfig.getChannel();
    this.setupConsumers();
  }

  private async setupConsumers(): Promise<void> {
    // Task notificaties consumer
    this.channel?.consume('task.notifications', async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await this.processTaskNotification(content);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Fout bij verwerken task notificatie:', error);
        // Negative acknowledge bij verwerkingsfout
        this.channel?.nack(msg, false, false);
      }
    });

    // Discord notificaties consumer
    this.channel?.consume('discord.notifications', async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await this.processDiscordNotification(content);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Fout bij verwerken discord notificatie:', error);
        this.channel?.nack(msg, false, false);
      }
    });
  }

  async createNotification(data: Partial<INotification>): Promise<INotification> {
    try {
      const notification = await notificationRepository.createNotification(data);
      
      // Publiceer notificatie naar juiste queue op basis van channelType
      const routingKey = `${data.type?.toLowerCase()}.notification`;
      await rabbitmqConfig.publishNotification(routingKey, {
        notificationId: notification._id,
        ...data
      });

      return notification;
    } catch (error) {
      throw new ApiError(500, 'Fout bij aanmaken notificatie');
    }
  }

  private async processTaskNotification(content: any): Promise<void> {
    const { notificationId, userId, title, message } = content;

    try {
      // Verwerk task notificatie (bijv. websocket push)
      console.log(`Task notificatie voor user ${userId}: ${title}`);
      
      // Update notificatie status
      await notificationRepository.markAsSent(notificationId);
    } catch (error) {
      console.error('Fout bij verwerken task notificatie:', error);
      await notificationRepository.markAsFailed(notificationId, error as string);
    }
  }

  private async processDiscordNotification(content: any): Promise<void> {
    const { notificationId, userId, title, message } = content;

    try {
      // Verwerk Discord notificatie
      // TODO: Integreer met Discord service voor het versturen van berichten
      console.log(`Discord notificatie voor user ${userId}: ${title}`);
      
      await notificationRepository.markAsSent(notificationId);
    } catch (error) {
      console.error('Fout bij verwerken discord notificatie:', error);
      await notificationRepository.markAsFailed(notificationId, error as string);
    }
  }

  async getUserNotifications(
    userId: string,
    status?: string,
    limit?: number
  ): Promise<INotification[]> {
    return notificationRepository.findByUserAndStatus(userId, status, limit);
  }

  async markNotificationAsSeen(notificationId: string): Promise<INotification | null> {
    return notificationRepository.update(notificationId, {
      status: 'SENT',
      sentAt: new Date()
    });
  }
}

export default new NotificationService();