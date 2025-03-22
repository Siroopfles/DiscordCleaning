import { ChannelType, ChannelConfig } from './channel.types';
import { MessageTemplate, RetryConfig } from './message.types';

/**
 * Provider status for health monitoring
 */
export enum ProviderStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  MAINTENANCE = 'MAINTENANCE',
  DOWN = 'DOWN'
}

/**
 * Base provider configuration
 */
export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  supportedChannels: ChannelType[];
  defaultRetryConfig?: RetryConfig;
  rateLimits?: {
    global?: {
      maxPerSecond?: number;
      maxPerMinute?: number;
      maxPerHour?: number;
    };
    perChannel?: {
      maxPerSecond?: number;
      maxPerMinute?: number;
      maxPerHour?: number;
    };
  };
}

/**
 * Provider capabilities and feature flags
 */
export interface ProviderCapabilities {
  maxChannels?: number;
  maxTemplates?: number;
  supportedTemplateFormats: string[];
  supportsBulkOperations: boolean;
  supportsDeliveryTracking: boolean;
  supportedContentTypes: string[];
  maxMessageSize?: number;
  requiresAuthentication: boolean;
}

/**
 * Provider authentication configuration
 */
export interface ProviderAuth {
  type: 'apiKey' | 'oauth2' | 'basic';
  credentials: Record<string, string>;
  scopes?: string[];
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Provider health metrics
 */
export interface ProviderMetrics {
  uptime: number; // in seconds
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
  averageDeliveryTime: number; // in milliseconds
  channelMetrics: Record<string, {
    messagesSent: number;
    deliveryRate: number;
    errorRate: number;
  }>;
}

/**
 * Provider template registration
 */
export interface ProviderTemplate<T = Record<string, unknown>> extends MessageTemplate<T> {
  providerId: string;
  channelTypes: ChannelType[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider channel registration
 */
export interface ProviderChannel {
  providerId: string;
  channelConfig: ChannelConfig;
  status: ProviderStatus;
  connectedAt?: Date;
  lastActiveAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Provider initialization options
 */
export interface ProviderOptions {
  auth: ProviderAuth;
  defaultChannels?: ChannelConfig[];
  templates?: ProviderTemplate[];
  rateLimitOptions?: {
    enableGlobalRateLimit?: boolean;
    enableChannelRateLimit?: boolean;
    rateLimitStrategy?: 'sliding' | 'fixed';
  };
  monitoring?: {
    enableHealthChecks?: boolean;
    healthCheckInterval?: number;
    metricsEnabled?: boolean;
  };
}