import { Client, TextChannel } from 'discord.js';

export enum NotificationType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
  DISCORD_MESSAGE = 'discord.message',
  DISCORD_ALERT = 'discord.alert'
}

export interface BaseNotification {
  id: string;
  type: NotificationType;
  timestamp: Date;
  guildId: string;
}

export interface TaskNotification extends BaseNotification {
  taskId: string;
  taskTitle: string;
  userId?: string;
  action: string;
}

export interface DiscordNotification extends BaseNotification {
  channelId: string;
  content: string;
  embed?: boolean;
}

export type Notification = TaskNotification | DiscordNotification;

export interface NotificationOptions {
  persist?: boolean;
  priority?: 'high' | 'normal' | 'low';
  delay?: number;
}

// Abstract base strategy
export interface NotificationStrategy {
  send(notification: Notification): Promise<void>;
}

// Specific strategy interfaces
export interface DiscordNotificationStrategy extends NotificationStrategy {
  send(notification: DiscordNotification): Promise<void>;
}

export interface TaskNotificationStrategy extends NotificationStrategy {
  send(notification: TaskNotification): Promise<void>;
}

export interface NotificationServiceInterface {
  send(type: NotificationType, data: Partial<Notification>, options?: NotificationOptions): Promise<void>;
  addObserver(observer: (notification: Notification) => Promise<void>): void;
  removeObserver(observer: (notification: Notification) => Promise<void>): void;
}