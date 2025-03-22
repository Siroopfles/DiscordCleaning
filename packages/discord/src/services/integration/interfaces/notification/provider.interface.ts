import { EventEmitter } from 'events';
import { IMessage } from './message.interface';
import { INotificationChannel } from './channel.interface';
import {
  ProviderConfig,
  ProviderCapabilities,
  ProviderMetrics,
  ProviderTemplate,
  ProviderChannel,
  ProviderStatus,
  ProviderAuth
} from './types/provider.types';
import { ChannelConfig, ChannelType } from './types/channel.types';
import { MessageTemplate } from './types/message.types';

/**
 * Interface defining the notification provider contract
 */
export interface INotificationProvider extends EventEmitter {
  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig;

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<ProviderConfig>): Promise<void>;

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * Get provider status
   */
  getStatus(): ProviderStatus;

  /**
   * Initialize the provider with authentication
   */
  initialize(auth: ProviderAuth): Promise<void>;

  /**
   * Register a new channel with this provider
   */
  registerChannel(config: ChannelConfig): Promise<INotificationChannel>;

  /**
   * Get a registered channel by ID
   */
  getChannel(channelId: string): INotificationChannel | null;

  /**
   * Get all registered channels
   */
  getChannels(): INotificationChannel[];

  /**
   * Get channels of a specific type
   */
  getChannelsByType(type: ChannelType): INotificationChannel[];

  /**
   * Register a message template
   */
  registerTemplate<T extends Record<string, unknown>>(
    template: MessageTemplate<T>
  ): Promise<ProviderTemplate<T>>;

  /**
   * Get a registered template by ID
   */
  getTemplate<T extends Record<string, unknown>>(
    templateId: string
  ): Promise<ProviderTemplate<T> | null>;

  /**
   * Send a message through appropriate channels
   */
  send(message: IMessage): Promise<void>;

  /**
   * Send messages in bulk if supported
   */
  sendBulk?(messages: IMessage[]): Promise<void>;

  /**
   * Get provider metrics
   */
  getMetrics(): Promise<ProviderMetrics>;

  /**
   * Events:
   * - 'status': Emitted when provider status changes
   * - 'channel': Emitted for channel updates
   * - 'template': Emitted for template updates
   * - 'error': Emitted when provider encounters an error
   * - 'metric': Emitted when metrics are updated
   */

  /**
   * Validate provider configuration and state
   */
  validate(): Promise<boolean>;

  /**
   * Test provider connectivity
   */
  testConnection(): Promise<boolean>;

  /**
   * Close provider and cleanup resources
   */
  dispose(): Promise<void>;

  /**
   * Get registered channel info
   */
  getRegisteredChannels(): ProviderChannel[];

  /**
   * Get provider-specific features
   */
  getFeatures(): Record<string, unknown>;

  /**
   * Check health status of all channels
   */
  checkHealth(): Promise<{
    status: ProviderStatus;
    channels: Record<string, ProviderStatus>;
  }>;
}