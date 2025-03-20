import { Client, TextChannel, MessageEmbed } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import rabbitmq from '../../config/rabbitmq';
import logger from '../../utils/logger';
import {
  Notification,
  NotificationType,
  TaskNotification,
  DiscordNotification,
  NotificationOptions
} from '../types/notification.types';

// Strategy pattern voor notificatie kanalen
interface NotificationStrategy {
  send(notification: Notification): Promise<void>;
}

// Discord notificatie strategie
class DiscordStrategy implements NotificationStrategy {
  constructor(private discordClient: Client) {}

  async send(notification: Notification): Promise<void> {
    try {
      if ('channelId' in notification) {
        const channel = await this.discordClient.channels.fetch(notification.channelId);
        
        if (channel instanceof TextChannel) {
          if (notification.embed) {
            const embed = new MessageEmbed()
              .setTitle('Notificatie')
              .setDescription(notification.content)
              .setColor('#0099ff')
              .setTimestamp();
            
            await channel.send({ embeds: [embed] });
          } else {
            await channel.send(notification.content);
          }
        }
      }
    } catch (error) {
      logger.error('Discord notification error:', error);
      throw error;
    }
  }
}

// Task notificatie strategie
class TaskStrategy implements NotificationStrategy {
  async send(notification: TaskNotification): Promise<void> {
    try {
      // Publish naar task notifications queue
      await rabbitmq.publishNotification(
        notification.type,
        notification
      );
    } catch (error) {
      logger.error('Task notification error:', error);
      throw error;
    }
  }
}

// NotificationService met Observer pattern
export class NotificationService {
  private strategies: Map<NotificationType, NotificationStrategy>;
  private observers: ((notification: Notification) => Promise<void>)[] = [];

  constructor(discordClient: Client) {
    // Initialiseer strategieën
    this.strategies = new Map([
      [NotificationType.DISCORD_MESSAGE, new DiscordStrategy(discordClient)],
      [NotificationType.DISCORD_ALERT, new DiscordStrategy(discordClient)],
      [NotificationType.TASK_CREATED, new TaskStrategy()],
      [NotificationType.TASK_UPDATED, new TaskStrategy()],
      [NotificationType.TASK_DELETED, new TaskStrategy()],
      [NotificationType.TASK_ASSIGNED, new TaskStrategy()],
      [NotificationType.TASK_COMPLETED, new TaskStrategy()]
    ]);

    // Setup message queue consumers
    this.setupQueueConsumers();
  }

  // Observer pattern methodes
  addObserver(observer: (notification: Notification) => Promise<void>): void {
    this.observers.push(observer);
  }

  removeObserver(observer: (notification: Notification) => Promise<void>): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  private async notifyObservers(notification: Notification): Promise<void> {
    for (const observer of this.observers) {
      try {
        await observer(notification);
      } catch (error) {
        logger.error('Observer notification error:', error);
      }
    }
  }

  // Queue consumer setup
  private async setupQueueConsumers(): Promise<void> {
    const channel = rabbitmq.getChannel();

    // Consumer voor task notificaties
    await channel.consume('task.notifications', async (msg) => {
      if (msg) {
        try {
          const notification = JSON.parse(msg.content.toString()) as TaskNotification;
          await this.notifyObservers(notification);
          channel.ack(msg);
        } catch (error) {
          logger.error('Task queue consumer error:', error);
          channel.nack(msg);
        }
      }
    });

    // Consumer voor discord notificaties
    await channel.consume('discord.notifications', async (msg) => {
      if (msg) {
        try {
          const notification = JSON.parse(msg.content.toString()) as DiscordNotification;
          await this.notifyObservers(notification);
          channel.ack(msg);
        } catch (error) {
          logger.error('Discord queue consumer error:', error);
          channel.nack(msg);
        }
      }
    });
  }

  // Hoofdmethode voor het versturen van notificaties
  async send(
    type: NotificationType,
    data: Partial<Notification>,
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      const strategy = this.strategies.get(type);
      if (!strategy) {
        throw new Error(`Geen strategie gevonden voor notificatie type: ${type}`);
      }

      const notification: Notification = {
        id: uuidv4(),
        type,
        timestamp: new Date(),
        ...data
      } as Notification;

      // Verwerk notificatie opties
      if (options.delay) {
        setTimeout(() => strategy.send(notification), options.delay);
      } else {
        await strategy.send(notification);
      }

      // Notify observers
      await this.notifyObservers(notification);

    } catch (error) {
      logger.error('Notification service error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default NotificationService;