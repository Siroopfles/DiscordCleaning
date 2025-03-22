import { BaseError } from '../../../../../core/errors/base.error';

/**
 * Queue-specific error class
 */
export class QueueError extends BaseError {
  readonly name = 'QueueError';
  
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { cause: options?.cause });
  }
}

/**
 * Configuration options for queue connections
 */
export interface IQueueConfiguration {
  /** Connection URL for the queue service */
  url: string;
  /** Queue name to publish/consume from */
  queueName: string;
  /** Exchange name for topic-based routing */
  exchangeName: string;
  /** Maximum number of retries for operations */
  maxRetries: number;
  /** Timeout in milliseconds for operations */
  operationTimeout: number;
  /** Maximum concurrent messages to process */
  prefetchCount: number;
  /** Dead letter exchange name */
  deadLetterExchange: string;
  /** Dead letter routing key */
  deadLetterRoutingKey: string;
}

/**
 * Message structure for queue operations
 */
export interface IQueueMessage<T = unknown> {
  /** Unique message identifier */
  id: string;
  /** Message payload */
  payload: T;
  /** Message headers for metadata */
  headers: Record<string, string>;
  /** Timestamp when message was created */
  timestamp: Date;
  /** Number of delivery attempts */
  retryCount: number;
}

/**
 * Interface for publishing messages to a queue
 */
export interface IQueuePublisher {
  /**
   * Publish a message to the queue
   * @param message Message to publish
   * @throws {QueueError} If publishing fails
   */
  publish<T>(message: IQueueMessage<T>): Promise<void>;

  /**
   * Publish multiple messages to the queue
   * @param messages Array of messages to publish
   * @throws {QueueError} If publishing fails
   */
  publishBatch<T>(messages: IQueueMessage<T>[]): Promise<void>;
}

/**
 * Message handler function type
 */
export type MessageHandler<T = unknown> = (message: IQueueMessage<T>) => Promise<void>;

/**
 * Interface for consuming messages from a queue
 */
export interface IQueueConsumer {
  /**
   * Start consuming messages from the queue
   * @param handler Function to handle received messages
   * @throws {QueueError} If consumer setup fails
   */
  startConsuming<T>(handler: MessageHandler<T>): Promise<void>;

  /**
   * Stop consuming messages
   */
  stopConsuming(): Promise<void>;

  /**
   * Acknowledge a message as processed
   * @param message Message to acknowledge
   */
  acknowledge(message: IQueueMessage): Promise<void>;

  /**
   * Reject a message (will be moved to dead letter queue)
   * @param message Message to reject
   * @param requeue Whether to requeue the message
   */
  reject(message: IQueueMessage, requeue?: boolean): Promise<void>;
}

/**
 * Interface for the main queue service
 */
export interface IQueueService {
  /**
   * Initialize the queue service
   * @throws {QueueError} If initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Get a publisher instance
   */
  getPublisher(): IQueuePublisher;

  /**
   * Get a consumer instance
   */
  getConsumer(): IQueueConsumer;

  /**
   * Check queue health
   * @returns True if queue is healthy
   */
  checkHealth(): Promise<boolean>;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;
}