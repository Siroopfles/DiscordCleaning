import { Channel } from 'amqplib';
import { Client, EmbedBuilder } from 'discord.js';
import rabbitmqConfig from '../config/rabbitmq';
import notificationRepository from '../repositories/notification.repository';
import { INotification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class NotificationService {
  private channel: Channel | null = null;
  private discordClient: Client;

  constructor(discordClient: Client) {
    this.discordClient = discordClient;
  }

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
    const { notificationId, channelId, content: messageContent, embed, guildId } = content;

    try {
      const guild = await this.discordClient.guilds.fetch(guildId);
      const channel = await guild.channels.fetch(channelId);

      if (!channel?.isTextBased()) {
        throw new Error('Kanaal is geen tekst kanaal');
      }

      if (embed) {
        const embedBuilder = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(messageContent.title || 'Notificatie')
          .setDescription(messageContent.description)
          .setTimestamp();

        if (messageContent.fields?.length > 0) {
          embedBuilder.addFields(messageContent.fields);
        }

        await channel.send({ embeds: [embedBuilder] });
      } else {
        await channel.send(messageContent);
      }

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

// Singleton instance wordt geïnitialiseerd in de Discord bot setup
let instance: NotificationService | null = null;

export const initializeNotificationService = (discordClient: Client): NotificationService => {
  if (!instance) {
    instance = new NotificationService(discordClient);
  }
  return instance;
};

export default {
  initialize: initializeNotificationService,
  getInstance: () => {
    if (!instance) {
      throw new Error('NotificationService niet geïnitialiseerd');
    }
    return instance;
  }
};