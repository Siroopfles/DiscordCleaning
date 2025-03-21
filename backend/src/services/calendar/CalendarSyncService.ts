import { Channel } from 'amqplib';
import Redis from 'ioredis';
import { GoogleCalendarClient } from './GoogleCalendarClient';
import { QUEUE_CONFIG, EXCHANGE_CONFIG } from '../../config/queue/rabbitmq.config';
import { checkRateLimit, getCachedData, setCachedData } from '../../config/queue/redis.config';
import {
  CalendarEvent,
  CalendarServiceConfig,
  CalendarSyncMessage,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  CACHE_KEYS,
  SyncOperation,
  SyncResult
} from './types';

export class CalendarSyncService {
  private channel: Channel;
  private redis: Redis;
  private calendarClient: GoogleCalendarClient;
  private config: CalendarServiceConfig;

  constructor(
    channel: Channel,
    redis: Redis,
    calendarClient: GoogleCalendarClient,
    config: CalendarServiceConfig
  ) {
    this.channel = channel;
    this.redis = redis;
    this.calendarClient = calendarClient;
    this.config = config;
    this.setupConsumers();
  }

  private async setupConsumers(): Promise<void> {
    // Main sync queue consumer
    await this.channel.consume(
      QUEUE_CONFIG.CALENDAR_SYNC,
      async (msg) => {
        if (!msg) return;

        try {
          const syncMessage: CalendarSyncMessage = JSON.parse(msg.content.toString());
          const result = await this.processSyncOperation(syncMessage);

          if (!result.success && result.retryable && syncMessage.operation.retryCount! < this.config.maxRetries) {
            // Retry logic
            await this.scheduleRetry(syncMessage);
          } else {
            // Publish result
            await this.publishSyncResult(syncMessage.correlationId, result);
          }

          await this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing sync message:', error);
          await this.channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );

    // Retry queue consumer
    await this.channel.consume(
      QUEUE_CONFIG.CALENDAR_SYNC_RETRY,
      async (msg) => {
        if (!msg) return;

        try {
          const syncMessage: CalendarSyncMessage = JSON.parse(msg.content.toString());
          await this.channel.publish(
            EXCHANGE_CONFIG.CALENDAR,
            'calendar.sync.retry',
            Buffer.from(JSON.stringify(syncMessage))
          );
          await this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing retry message:', error);
          await this.channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }

  private async processSyncOperation(message: CalendarSyncMessage): Promise<SyncResult> {
    const { userId, operation } = message;

    // Check rate limit
    const rateLimitKey = CACHE_KEYS.RATE_LIMIT(userId);
    const withinLimit = await checkRateLimit(
      this.redis,
      rateLimitKey,
      this.config.rateLimit.maxRequests,
      this.config.rateLimit.windowMs
    );

    if (!withinLimit) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        retryable: true
      };
    }

    try {
      let event: CalendarEvent | undefined;

      switch (operation.type) {
        case 'create':
          if (!this.isCreateEventDTO(operation.data)) {
            throw new Error('Invalid create event data');
          }
          event = await this.calendarClient.createEvent(operation.data);
          await this.invalidateCache(userId);
          break;

        case 'update':
          if (!this.isUpdateEventDTO(operation.data)) {
            throw new Error('Invalid update event data');
          }
          event = await this.calendarClient.updateEvent(operation.data);
          await this.invalidateCache(userId);
          break;

        case 'delete':
          if (!operation.eventId) {
            throw new Error('Event ID is required for delete operation');
          }
          await this.calendarClient.deleteEvent(operation.eventId);
          await this.invalidateCache(userId);
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      return {
        success: true,
        event
      };

    } catch (error) {
      console.error(`Calendar sync error for user ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: this.isRetryableError(error)
      };
    }
  }

  private isCreateEventDTO(data: unknown): data is CreateCalendarEventDTO {
    return (
      !!data &&
      typeof data === 'object' &&
      'summary' in data &&
      typeof (data as CreateCalendarEventDTO).summary === 'string'
    );
  }

  private isUpdateEventDTO(data: unknown): data is UpdateCalendarEventDTO {
    return (
      !!data &&
      typeof data === 'object' &&
      'id' in data &&
      typeof (data as UpdateCalendarEventDTO).id === 'string'
    );
  }

  private async scheduleRetry(message: CalendarSyncMessage): Promise<void> {
    const retryMessage: CalendarSyncMessage = {
      ...message,
      operation: {
        ...message.operation,
        retryCount: (message.operation.retryCount || 0) + 1
      }
    };

    await this.channel.publish(
      EXCHANGE_CONFIG.CALENDAR,
      'calendar.sync.retry',
      Buffer.from(JSON.stringify(retryMessage))
    );
  }

  private async publishSyncResult(correlationId: string, result: SyncResult): Promise<void> {
    await this.channel.publish(
      EXCHANGE_CONFIG.CALENDAR,
      'calendar.sync.result',
      Buffer.from(JSON.stringify(result)),
      { correlationId }
    );
  }

  private async invalidateCache(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.CALENDAR_EVENTS(userId));
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors or rate limit errors
      return [
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'QUOTA_EXCEEDED',
        'RATE_LIMITED'
      ].some(code => error.message.includes(code));
    }
    return false;
  }
}