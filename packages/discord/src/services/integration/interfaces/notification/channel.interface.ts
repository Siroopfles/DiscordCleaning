import { EventEmitter } from 'events';
import { IMessage } from './message.interface';
import { 
  ChannelConfig, 
  ChannelDeliveryStatus, 
  ChannelCapabilities, 
  ChannelMetrics 
} from './types/channel.types';

/**
 * Interface defining the notification channel contract
 */
export interface INotificationChannel extends EventEmitter {
  /**
   * Get the channel configuration
   */
  getConfig(): ChannelConfig;

  /**
   * Update channel configuration
   */
  updateConfig(config: Partial<ChannelConfig>): Promise<void>;

  /**
   * Get channel delivery status
   */
  getStatus(): ChannelDeliveryStatus;

  /**
   * Get channel capabilities
   */
  getCapabilities(): ChannelCapabilities;

  /**
   * Check if channel can handle a specific message
   */
  canHandle(message: IMessage): Promise<boolean>;

  /**
   * Send a message through this channel
   */
  send(message: IMessage): Promise<void>;

  /**
   * Send multiple messages in bulk if supported
   */
  sendBulk?(messages: IMessage[]): Promise<void>;

  /**
   * Get delivery status for a specific message
   */
  getMessageStatus(messageId: string): Promise<ChannelDeliveryStatus | null>;

  /**
   * Get channel metrics
   */
  getMetrics(): Promise<ChannelMetrics>;

  /**
   * Initialize the channel
   */
  initialize(): Promise<void>;

  /**
   * Cleanup channel resources
   */
  dispose(): Promise<void>;

  /**
   * Events:
   * - 'status': Emitted when channel status changes
   * - 'delivery': Emitted for message delivery updates
   * - 'error': Emitted when channel encounters an error
   * - 'rateLimit': Emitted when rate limit is hit
   * - 'metric': Emitted when metrics are updated
   */

  /**
   * Validate channel configuration
   */
  validate(): Promise<boolean>;

  /**
   * Test channel connectivity
   */
  testConnection(): Promise<boolean>;

  /**
   * Reset channel state (clear errors, reset rate limits)
   */
  reset(): Promise<void>;

  /**
   * Get channel-specific features
   */
  getFeatures(): Record<string, unknown>;
}