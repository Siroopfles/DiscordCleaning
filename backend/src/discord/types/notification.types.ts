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