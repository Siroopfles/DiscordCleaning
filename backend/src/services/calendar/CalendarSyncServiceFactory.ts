import { Channel } from 'amqplib';
import Redis from 'ioredis';
import { CalendarSyncService } from './CalendarSyncService';
import { GoogleCalendarClient, GoogleCalendarConfig } from './GoogleCalendarClient';
import { CalendarServiceConfig } from './types';
import { setupQueueConnection } from '../../config/queue/rabbitmq.config';
import { createRedisClient } from '../../config/queue/redis.config';

const DEFAULT_CONFIG: CalendarServiceConfig = {
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  },
  maxRetries: 3,
  retryDelayMs: 60000 // 1 minute
};

export interface CalendarSyncServiceOptions {
  googleConfig: GoogleCalendarConfig;
  serviceConfig?: Partial<CalendarServiceConfig>;
  redisConfig?: { 
    host: string;
    port: number;
    password?: string;
  };
  rabbitmqUrl?: string;
}

export async function createCalendarSyncService(
  options: CalendarSyncServiceOptions
): Promise<CalendarSyncService> {
  // Setup RabbitMQ connection
  const { channel, connection } = await setupQueueConnection();

  // Setup Redis client
  const redis = createRedisClient(options.redisConfig);

  // Create Google Calendar client
  const calendarClient = new GoogleCalendarClient(options.googleConfig);

  // Merge default config with provided config
  const serviceConfig: CalendarServiceConfig = {
    ...DEFAULT_CONFIG,
    ...options.serviceConfig
  };

  // Create CalendarSyncService instance
  const syncService = new CalendarSyncService(
    channel,
    redis,
    calendarClient,
    serviceConfig
  );

  // Handle cleanup on process termination
  process.on('SIGTERM', async () => {
    await cleanup(channel, connection, redis);
  });

  process.on('SIGINT', async () => {
    await cleanup(channel, connection, redis);
  });

  return syncService;
}

async function cleanup(channel: Channel, connection: any, redis: Redis): Promise<void> {
  try {
    await channel.close();
    await connection.close();
    await redis.quit();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}