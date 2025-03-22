import { EventEmitter } from 'events';
import { INotificationProvider } from './provider.interface';
import { INotificationChannel } from './channel.interface';
import { IMessage } from './message.interface';
import {
  ProviderAuth,
  ProviderConfig,
  ProviderStatus,
  ProviderCapabilities,
  ProviderMetrics,
  ProviderTemplate,
  ProviderChannel
} from './types/provider.types';
import { ChannelConfig, ChannelType } from './types/channel.types';
import { MessageTemplate } from './types/message.types';
import { NotificationError, NotificationErrorCode } from './errors/notification.error';

/**
 * Abstract base class for notification providers
 * Implements common functionality and enforces interface contract
 */
export abstract class BaseProvider extends EventEmitter implements INotificationProvider {
  protected config: ProviderConfig;
  protected channels: Map<string, INotificationChannel>;
  protected templates: Map<string, ProviderTemplate>;
  protected status: ProviderStatus;
  protected auth?: ProviderAuth;

  constructor(config: ProviderConfig) {
    super();
    this.config = config;
    this.channels = new Map();
    this.templates = new Map();
    this.status = ProviderStatus.OPERATIONAL;
  }

  /**
   * Initialize provider with authentication
   */
  public async initialize(auth: ProviderAuth): Promise<void> {
    this.auth = auth;
    await this.validateAuth();
    await this.onInitialize();
  }

  /**
   * Provider-specific initialization logic
   */
  protected abstract onInitialize(): Promise<void>;

  public getConfig(): ProviderConfig {
    return { ...this.config };
  }

  public async updateConfig(config: Partial<ProviderConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config
    };
    await this.validate();
  }

  public abstract getCapabilities(): ProviderCapabilities;

  public getStatus(): ProviderStatus {
    return this.status;
  }

  public async registerChannel(config: ChannelConfig): Promise<INotificationChannel> {
    if (!this.config.supportedChannels.includes(config.type)) {
      throw NotificationError.invalidConfig(
        this.config.id,
        `Channel type ${config.type} not supported by provider ${this.config.id}`
      );
    }

    const channel = await this.createChannel(config);
    this.channels.set(config.id, channel);

    // Forward channel events
    channel.on('status', (status) => this.emit('channel', { channelId: config.id, status }));
    channel.on('error', (error) => this.emit('error', { channelId: config.id, error }));

    return channel;
  }

  /**
   * Provider-specific channel creation logic
   */
  protected abstract createChannel(config: ChannelConfig): Promise<INotificationChannel>;

  public getChannel(channelId: string): INotificationChannel | null {
    return this.channels.get(channelId) || null;
  }

  public getChannels(): INotificationChannel[] {
    return Array.from(this.channels.values());
  }

  public getChannelsByType(type: ChannelType): INotificationChannel[] {
    return this.getChannels().filter(channel => channel.getConfig().type === type);
  }

  public async registerTemplate<T extends Record<string, unknown>>(
    template: MessageTemplate<T>
  ): Promise<ProviderTemplate<T>> {
    const providerTemplate: ProviderTemplate<T> = {
      ...template,
      providerId: this.config.id,
      channelTypes: this.config.supportedChannels,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.validateTemplate(providerTemplate);
    this.templates.set(template.templateId, providerTemplate);
    
    return providerTemplate;
  }

  public async getTemplate<T extends Record<string, unknown>>(
    templateId: string
  ): Promise<ProviderTemplate<T> | null> {
    return (this.templates.get(templateId) as ProviderTemplate<T>) || null;
  }

  public async send(message: IMessage): Promise<void> {
    await this.validate();
    
    const channels = await this.resolveChannelsForMessage(message);
    if (channels.length === 0) {
      throw NotificationError.messageSendFailed(
        this.config.id,
        'unknown',
        message.getId(),
        'No suitable channels found for message'
      );
    }

    await Promise.all(channels.map(channel => channel.send(message)));
  }

  /**
   * Get metrics from all channels
   */
  public async getMetrics(): Promise<ProviderMetrics> {
    const channelMetrics: Record<string, {
      messagesSent: number;
      deliveryRate: number;
      errorRate: number;
    }> = {};

    for (const [id, channel] of this.channels) {
      const metrics = await channel.getMetrics();
      channelMetrics[id] = {
        messagesSent: metrics.messagesSentTotal,
        deliveryRate: (metrics.messagesSentTotal - metrics.messagesFailedTotal) / metrics.messagesSentTotal,
        errorRate: metrics.errorRate
      };
    }

    return {
      uptime: process.uptime(),
      totalMessagesSent: Object.values(channelMetrics).reduce((sum, m) => sum + m.messagesSent, 0),
      totalMessagesDelivered: 0, // Implement based on delivery tracking
      totalMessagesFailed: 0, // Implement based on error tracking
      averageDeliveryTime: 0, // Implement based on timing metrics
      channelMetrics
    };
  }

  public async validate(): Promise<boolean> {
    if (!this.auth) {
      throw NotificationError.authenticationFailed(
        this.config.id,
        'Provider not initialized with auth credentials'
      );
    }

    if (!this.config.enabled) {
      throw NotificationError.providerUnavailable(
        this.config.id,
        ProviderStatus.DOWN,
        'Provider is disabled'
      );
    }

    return true;
  }

  protected async validateAuth(): Promise<void> {
    if (!this.auth) {
      throw NotificationError.authenticationFailed(
        this.config.id,
        'Authentication configuration required'
      );
    }
  }

  protected async validateTemplate(template: ProviderTemplate): Promise<void> {
    if (!template.templateId) {
      throw NotificationError.templateValidationFailed(
        this.config.id,
        'unknown',
        'Template ID is required'
      );
    }
  }

  public abstract testConnection(): Promise<boolean>;

  public async dispose(): Promise<void> {
    await Promise.all(Array.from(this.channels.values()).map(channel => channel.dispose()));
    this.channels.clear();
    this.templates.clear();
    this.removeAllListeners();
  }

  public getRegisteredChannels(): ProviderChannel[] {
    return Array.from(this.channels.entries()).map(([id, channel]) => ({
      providerId: this.config.id,
      channelConfig: channel.getConfig(),
      status: this.status,
      connectedAt: new Date(), // Implement proper connection tracking
      lastActiveAt: new Date() // Implement proper activity tracking
    }));
  }

  public abstract getFeatures(): Record<string, unknown>;

  public async checkHealth(): Promise<{
    status: ProviderStatus;
    channels: Record<string, ProviderStatus>;
  }> {
    const channelStatuses: Record<string, ProviderStatus> = {};
    
    for (const [id, channel] of this.channels) {
      try {
        await channel.testConnection();
        channelStatuses[id] = ProviderStatus.OPERATIONAL;
      } catch {
        channelStatuses[id] = ProviderStatus.DOWN;
      }
    }

    const overallStatus = Object.values(channelStatuses).every(
      status => status === ProviderStatus.OPERATIONAL
    ) ? ProviderStatus.OPERATIONAL : ProviderStatus.DEGRADED;

    return {
      status: overallStatus,
      channels: channelStatuses
    };
  }

  /**
   * Resolve which channels should handle a given message
   */
  protected async resolveChannelsForMessage(message: IMessage): Promise<INotificationChannel[]> {
    const channels = this.getChannels();
    const eligibleChannels: INotificationChannel[] = [];

    for (const channel of channels) {
      if (await channel.canHandle(message)) {
        eligibleChannels.push(channel);
      }
    }

    return eligibleChannels;
  }
}