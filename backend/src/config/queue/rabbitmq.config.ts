import { Channel, Connection, connect } from 'amqplib';

export const QUEUE_CONFIG = {
  CALENDAR_SYNC: 'calendar_sync',
  CALENDAR_SYNC_DLQ: 'calendar_sync_dlq', // Dead Letter Queue
  CALENDAR_SYNC_RETRY: 'calendar_sync_retry',
  EVENT_PROCESSING: 'event_processing',
  EVENT_PROCESSING_DLQ: 'event_processing_dlq'
};

export const EXCHANGE_CONFIG = {
  CALENDAR: 'calendar_exchange',
  DLX: 'dead_letter_exchange' // Dead Letter Exchange
};

export interface QueueConnection {
  channel: Channel;
  connection: Connection;
}

export async function setupQueueConnection(): Promise<QueueConnection> {
  const connection = await connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const channel = await connection.createChannel();

  // Setup exchanges
  await channel.assertExchange(EXCHANGE_CONFIG.CALENDAR, 'topic', { durable: true });
  await channel.assertExchange(EXCHANGE_CONFIG.DLX, 'topic', { durable: true });

  // Setup queues with dead letter configuration
  await channel.assertQueue(QUEUE_CONFIG.CALENDAR_SYNC, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE_CONFIG.DLX,
      'x-dead-letter-routing-key': QUEUE_CONFIG.CALENDAR_SYNC_DLQ
    }
  });

  await channel.assertQueue(QUEUE_CONFIG.CALENDAR_SYNC_DLQ, { 
    durable: true 
  });

  await channel.assertQueue(QUEUE_CONFIG.CALENDAR_SYNC_RETRY, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE_CONFIG.CALENDAR,
      'x-dead-letter-routing-key': QUEUE_CONFIG.CALENDAR_SYNC,
      'x-message-ttl': 60000 // 1 minute retry delay
    }
  });

  await channel.assertQueue(QUEUE_CONFIG.EVENT_PROCESSING, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE_CONFIG.DLX,
      'x-dead-letter-routing-key': QUEUE_CONFIG.EVENT_PROCESSING_DLQ
    }
  });

  await channel.assertQueue(QUEUE_CONFIG.EVENT_PROCESSING_DLQ, { 
    durable: true 
  });

  // Bind queues to exchanges
  await channel.bindQueue(QUEUE_CONFIG.CALENDAR_SYNC, EXCHANGE_CONFIG.CALENDAR, 'calendar.sync.*');
  await channel.bindQueue(QUEUE_CONFIG.CALENDAR_SYNC_DLQ, EXCHANGE_CONFIG.DLX, 'calendar.sync.*');
  await channel.bindQueue(QUEUE_CONFIG.EVENT_PROCESSING, EXCHANGE_CONFIG.CALENDAR, 'calendar.event.*');
  await channel.bindQueue(QUEUE_CONFIG.EVENT_PROCESSING_DLQ, EXCHANGE_CONFIG.DLX, 'calendar.event.*');

  return { channel, connection };
}