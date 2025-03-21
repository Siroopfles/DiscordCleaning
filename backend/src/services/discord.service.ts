import { NotificationService, NotificationType, Notification, DiscordClient } from '@newboom/discord';
import rabbitmq from '../config/rabbitmq';
import logger from '../utils/logger';

class DiscordService {
  private notificationService: NotificationService;

  constructor(client: DiscordClient) {
    this.notificationService = new NotificationService(client);
    this.setupQueueConsumers();
  }

  private async setupQueueConsumers(): Promise<void> {
    const channel = rabbitmq.getChannel();

    // Consumer voor task notificaties
    await channel.consume('task.notifications', async (msg) => {
      if (msg) {
        try {
          const notification = JSON.parse(msg.content.toString()) as Notification;
          await this.notificationService.send(
            notification.type as NotificationType,
            notification
          );
          channel.ack(msg);
        } catch (error) {
          logger.error('Task queue consumer error:', error);
          channel.reject(msg, true); // requeue=true om het bericht opnieuw te verwerken
        }
      }
    });

    // Consumer voor discord notificaties
    await channel.consume('discord.notifications', async (msg) => {
      if (msg) {
        try {
          const notification = JSON.parse(msg.content.toString()) as Notification;
          await this.notificationService.send(
            notification.type as NotificationType,
            notification
          );
          channel.ack(msg);
        } catch (error) {
          logger.error('Discord queue consumer error:', error);
          channel.reject(msg, true); // requeue=true om het bericht opnieuw te verwerken
        }
      }
    });
  }

  async sendNotification(
    type: NotificationType,
    data: Partial<Notification>
  ): Promise<void> {
    await this.notificationService.send(type, data);
  }

  addNotificationObserver(observer: (notification: Notification) => Promise<void>): void {
    this.notificationService.addObserver(observer);
  }

  removeNotificationObserver(observer: (notification: Notification) => Promise<void>): void {
    this.notificationService.removeObserver(observer);
  }
}

export default DiscordService;