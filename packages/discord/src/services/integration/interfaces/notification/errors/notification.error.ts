import { BaseError } from '../../../../core/errors/base.error';
import { ErrorMetadata } from '../../../../core/errors/types';
import { ProviderStatus } from '../types/provider.types';

export enum NotificationErrorCode {
  // Provider errors
  PROVIDER_INIT_FAILED = 'PROVIDER_INIT_FAILED',
  PROVIDER_AUTH_FAILED = 'PROVIDER_AUTH_FAILED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  
  // Channel errors
  CHANNEL_CREATION_FAILED = 'CHANNEL_CREATION_FAILED',
  CHANNEL_INCOMPATIBLE = 'CHANNEL_INCOMPATIBLE',
  CHANNEL_UNAVAILABLE = 'CHANNEL_UNAVAILABLE',
  CHANNEL_OVERLOADED = 'CHANNEL_OVERLOADED',
  
  // Message errors
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  TEMPLATE_VALIDATION_FAILED = 'TEMPLATE_VALIDATION_FAILED',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SLA_THRESHOLD_EXCEEDED = 'SLA_THRESHOLD_EXCEEDED',
  
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG'
}

export interface NotificationErrorMetadata extends ErrorMetadata {
  providerId?: string;
  channelId?: string;
  messageId?: string;
  providerStatus?: ProviderStatus;
  retryAttempt?: number;
  slaTarget?: number;
  actualLatency?: number;
}

export class NotificationError extends BaseError {
  readonly code: NotificationErrorCode;
  readonly metadata: NotificationErrorMetadata;
  readonly name = 'NotificationError';

  constructor(
    code: NotificationErrorCode,
    message: string,
    options?: { cause?: Error; metadata?: NotificationErrorMetadata }
  ) {
    super(message, options);
    this.code = code;
    this.metadata = options?.metadata || {};
  }

  static initializationFailed(
    providerId: string,
    message: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.PROVIDER_INIT_FAILED,
      message,
      {
        cause,
        metadata: { providerId }
      }
    );
  }

  static authenticationFailed(
    providerId: string,
    message: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.PROVIDER_AUTH_FAILED,
      message,
      {
        cause,
        metadata: { providerId }
      }
    );
  }

  static channelCreationFailed(
    providerId: string,
    channelId: string,
    message: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.CHANNEL_CREATION_FAILED,
      message,
      {
        cause,
        metadata: { providerId, channelId }
      }
    );
  }

  static messageSendFailed(
    providerId: string,
    channelId: string,
    messageId: string,
    message: string,
    retryAttempt?: number,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.MESSAGE_SEND_FAILED,
      message,
      {
        cause,
        metadata: { providerId, channelId, messageId, retryAttempt }
      }
    );
  }

  static templateValidationFailed(
    providerId: string,
    templateId: string,
    message: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.TEMPLATE_VALIDATION_FAILED,
      message,
      {
        cause,
        metadata: { providerId, templateId }
      }
    );
  }

  static rateLimitExceeded(
    providerId: string,
    channelId: string,
    message: string
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      {
        metadata: { providerId, channelId }
      }
    );
  }

  static slaThresholdExceeded(
    providerId: string,
    channelId: string,
    messageId: string,
    slaTarget: number,
    actualLatency: number
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.SLA_THRESHOLD_EXCEEDED,
      `SLA threshold exceeded: target ${slaTarget}ms, actual ${actualLatency}ms`,
      {
        metadata: {
          providerId,
          channelId,
          messageId,
          slaTarget,
          actualLatency
        }
      }
    );
  }

  static providerUnavailable(
    providerId: string,
    status: ProviderStatus,
    message: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.PROVIDER_UNAVAILABLE,
      message,
      {
        cause,
        metadata: { providerId, providerStatus: status }
      }
    );
  }

  static channelIncompatible(
    providerId: string,
    channelId: string,
    messageId: string,
    message: string
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.CHANNEL_INCOMPATIBLE,
      message,
      {
        metadata: {
          providerId,
          channelId,
          messageId
        }
      }
    );
  }

  static channelUnavailable(
    providerId: string,
    reason: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.CHANNEL_UNAVAILABLE,
      reason,
      {
        cause,
        metadata: { providerId }
      }
    );
  }

  static channelOverloaded(
    providerId: string,
    channelId: string,
    queueSize: number,
    maxQueueSize: number
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.CHANNEL_OVERLOADED,
      `Channel ${channelId} is overloaded (queue: ${queueSize}/${maxQueueSize})`,
      {
        metadata: {
          providerId,
          channelId,
          queueSize,
          maxQueueSize
        }
      }
    );
  }

  static invalidConfig(
    providerId: string,
    message: string,
    cause?: Error
  ): NotificationError {
    return new NotificationError(
      NotificationErrorCode.INVALID_CONFIG,
      message,
      {
        cause,
        metadata: { providerId }
      }
    );
  }
}