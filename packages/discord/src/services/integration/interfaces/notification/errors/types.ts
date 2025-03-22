import { ErrorMetadata as BaseErrorMetadata } from '../../../../core/errors/types';

/**
 * Notification error codes for type-safe error handling
 */
export enum NotificationErrorCode {
  DELIVERY_FAILED = 'NOTIFICATION.DELIVERY_FAILED',
  PROVIDER_ERROR = 'NOTIFICATION.PROVIDER_ERROR',
  CHANNEL_ERROR = 'NOTIFICATION.CHANNEL_ERROR',
  INVALID_MESSAGE = 'NOTIFICATION.INVALID_MESSAGE',
  RATE_LIMIT_EXCEEDED = 'NOTIFICATION.RATE_LIMIT_EXCEEDED',
  TEMPLATE_ERROR = 'NOTIFICATION.TEMPLATE_ERROR'
}

/**
 * Extended error metadata for notification errors
 */
export interface ErrorMetadata extends BaseErrorMetadata {
  providerId?: string;
  channelId?: string;
  messageId?: string;
  templateId?: string;
  deliveryAttempts?: number;
  rateLimitReset?: number;
}