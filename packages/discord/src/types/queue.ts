import { Connection as AMQPConnection, Channel as AMQPChannel, ConsumeMessage, Options } from 'amqplib';

// Extend de amqplib types om de missende properties toe te voegen
export interface Connection extends AMQPConnection {
  createChannel(): Promise<Channel>;
  close(): Promise<void>;
}

export interface Channel extends AMQPChannel {
  assertQueue(queue: string, options?: Options.AssertQueue): Promise<void>;
  assertExchange(exchange: string, type: string, options?: Options.AssertExchange): Promise<void>;
  bindQueue(queue: string, exchange: string, pattern: string): Promise<void>;
  publish(exchange: string, routingKey: string, content: Buffer, options?: Options.Publish): boolean;
  consume(queue: string, onMessage: (msg: ConsumeMessage | null) => void): Promise<{ consumerTag: string }>;
  ack(message: ConsumeMessage): void;
  nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
  close(): Promise<void>;
}

export interface QueueConfig {
  url: string;
  queueName: string;
  exchangeName: string;
}

export interface MessageQueueService {
  setupMessageQueue(config: QueueConfig): Promise<void>;
  closeConnection(): Promise<void>;
}

export type MessageHandler = (msg: ConsumeMessage | null) => void | Promise<void>;