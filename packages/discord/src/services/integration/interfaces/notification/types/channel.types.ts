/**
 * Channel status for health monitoring and operational states
 */
export enum ChannelStatus {
  INITIALIZING = 'INITIALIZING',
  OPERATIONAL = 'OPERATIONAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEGRADED = 'DEGRADED',
  ERROR = 'ERROR',
  DOWN = 'DOWN',
  RATE_LIMITED = 'RATE_LIMITED',
  MAINTENANCE = 'MAINTENANCE'
}

/**
 * Supported notification channel types
 */
export enum ChannelType {
  DISCORD = 'DISCORD',
  WEBHOOK = 'WEBHOOK',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}

/**
 * Base channel configuration interface
 */
export interface ChannelConfig {
  id: string;
  type: ChannelType;
  enabled: boolean;
  rateLimits?: {
    maxPerSecond?: number;
    maxPerMinute?: number;
    maxPerHour?: number;
  };
  retry?: {
    maxAttempts: number;
    backoffFactor: number;
  };
  timeout?: number; // in milliseconds
}

/**
 * Discord-specific channel configuration
 */
export interface DiscordChannelConfig extends ChannelConfig {
  type: ChannelType.DISCORD;
  channelId: string;
  webhookUrl?: string;
  mentionRoles?: string[];
  useEmbeds?: boolean;
}

/**
 * Webhook-specific channel configuration
 */
export interface WebhookChannelConfig extends ChannelConfig {
  type: ChannelType.WEBHOOK;
  url: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic';
    token: string;
  };
}

/**
 * Channel delivery status information
 */
export interface ChannelDeliveryStatus {
  channelId: string;
  status: ChannelStatus;
  timestamp: Date;
  messagesSent: number;
  messagesFailedCount: number;
  lastError?: Error;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

/**
 * Channel capability flags
 */
export interface ChannelCapabilities {
  supportsTemplates: boolean;
  supportsAttachments: boolean;
  supportsScheduling: boolean;
  supportsRead: boolean;
  maxContentLength?: number;
  maxAttachmentSize?: number;
  supportedContentTypes?: string[];
}

/**
 * Channel health metrics
 */
export interface ChannelMetrics {
  messagesSentTotal: number;
  messagesFailedTotal: number;
  averageDeliveryTime: number; // in milliseconds
  rateLimitHits: number;
  errorRate: number; // percentage
  uptimePercentage: number;
}