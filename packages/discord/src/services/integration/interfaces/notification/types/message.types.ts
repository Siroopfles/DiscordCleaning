/**
 * Message priority levels for notification delivery
 */
export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Message delivery status tracking
 */
export enum MessageStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

/**
 * Configuration for message retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // in milliseconds
  backoffFactor: number;
  maxDelay?: number; // in milliseconds
}

/**
 * Base message payload structure
 */
export interface MessagePayload {
  id: string;
  subject?: string;
  content: string;
  timestamp: Date;
  priority: MessagePriority;
  metadata?: Record<string, unknown>;
}

/**
 * Message template data for structured content
 */
export interface MessageTemplate<T = Record<string, unknown>> {
  id: string;
  templateId: string;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Message delivery tracking information
 */
export interface MessageDeliveryInfo {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
  attemptCount?: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * Message options for delivery configuration
 */
export interface MessageOptions {
  priority?: MessagePriority;
  retry?: RetryConfig;
  expiration?: Date;
  channelId?: string;
  scheduling?: {
    sendAt?: Date;
    timeZone?: string;
  };
  tracking?: {
    requireConfirmation?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
  };
}