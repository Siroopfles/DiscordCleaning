import { EmbedBuilder, TextChannel } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from './base.service';
import { DiscordClient } from '../types';
import {
  Notification,
  NotificationType,
  TaskNotification,
  DiscordNotification,
  NotificationOptions,
  NotificationStrategy,
  NotificationServiceInterface
} from '../types/notification';
import { QueueConfig } from '../types/queue';
import { QueueNotificationStrategy } from './queue.strategy';

// Discord notificatie strategie
class DiscordStrategy implements NotificationStrategy {
  constructor(private discordClient: DiscordClient) {}

  async send(notification: Notification): Promise<void> {
    if ('channelId' in notification) {
      const channel = await this.discordClient.channels.fetch(notification.channelId);
      
      if (channel instanceof TextChannel) {
        if (notification.embed) {
          const embed = new EmbedBuilder()
            .setTitle('Notificatie')
            .setDescription(notification.content)
            .setColor('#0099ff')
            .setTimestamp();
          
          await channel.send({ embeds: [embed] });
        } else {
          await channel.send({ content: notification.content });
        }
      }
    }
  }
}

// Task notificatie strategie
class TaskStrategy implements NotificationStrategy {
  private queueStrategy: QueueNotificationStrategy;

  constructor(client: DiscordClient) {
    this.queueStrategy = new QueueNotificationStrategy(client);
  }

  async send(notification: TaskNotification): Promise<void> {
    await this.queueStrategy.send(notification);
  }
}

export class NotificationService extends BaseService implements NotificationServiceInterface {
  private strategies: Map<NotificationType, NotificationStrategy>;
  private observers: ((notification: Notification) => Promise<void>)[] = [];
  private queueStrategy: QueueNotificationStrategy;

  constructor(client: DiscordClient) {
    super(client);
    
    this.queueStrategy = new QueueNotificationStrategy(client);
    
    // Initialiseer strategieën
    this.strategies = new Map([
      [NotificationType.DISCORD_MESSAGE, new DiscordStrategy(this.client)],
      [NotificationType.DISCORD_ALERT, new DiscordStrategy(this.client)],
      [NotificationType.TASK_CREATED, new TaskStrategy(this.client)],
      [NotificationType.TASK_UPDATED, new TaskStrategy(this.client)],
      [NotificationType.TASK_DELETED, new TaskStrategy(this.client)],
      [NotificationType.TASK_ASSIGNED, new TaskStrategy(this.client)],
      [NotificationType.TASK_COMPLETED, new TaskStrategy(this.client)]
    ]);
  }

  protected async initialize(): Promise<void> {
    this.log('info', 'NotificationService initialized');
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
        this.log('error', 'Observer notification error:', error);
      }
    }
  }

  // Setup message queue
  async setupMessageQueue(config: QueueConfig): Promise<void> {
    try {
      await this.queueStrategy.setupMessageQueue(config);
      this.log('info', 'Message queue setup completed');
    } catch (error) {
      this.log('error', 'Failed to setup message queue:', error);
      throw error;
    }
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    try {
      await this.queueStrategy.closeConnection();
      this.log('info', 'Notification service cleanup completed');
    } catch (error) {
      this.log('error', 'Cleanup error:', error);
      throw error;
    }
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
      this.log('error', 'Notification service error:', error);
      throw error;
    }
  }
}