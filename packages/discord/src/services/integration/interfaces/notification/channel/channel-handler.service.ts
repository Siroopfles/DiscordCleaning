import { EventEmitter } from 'events';
import { IChannelHandler, ChannelHandlerConfig, ChannelHandlerStats } from './channel-handler.interface';
import { IChannelStrategy, ChannelMetrics, ChannelHealth, LoadBalancingMetrics } from './strategy.interface';
import { IMessage } from '../message.interface';
import { ChannelConfig, ChannelType, ChannelStatus } from '../types/channel.types';
import { NotificationError } from '../errors/notification.error';
import { ILoadBalancer } from './load-balancing/load-balancer.interface';
import { RoundRobinLoadBalancer } from './load-balancing/round-robin.strategy';
import { LeastLoadedBalancer } from './load-balancing/least-loaded.strategy';

const DEFAULT_CONFIG: ChannelHandlerConfig = {
  maxChannelsPerType: 10,
  healthCheckInterval: 30000, // 30 seconds
  loadBalancingStrategy: 'least-loaded',
  loadBalancingConfig: {
    maxQueueSize: 1000,
    targetThroughput: 100,
    balancingInterval: 1000
  }
};

/**
 * Channel Handler Service implementation
 * Manages channel strategies and coordinates message routing
 */
export class ChannelHandlerService extends EventEmitter implements IChannelHandler {
  private channels: Map<string, IChannelStrategy>;
  private config: ChannelHandlerConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private loadBalancer: ILoadBalancer;
  private stats: ChannelHandlerStats;

  constructor(config: Partial<ChannelHandlerConfig> = {}) {
    super();
    this.channels = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadBalancer = this.createLoadBalancer();
    this.stats = this.initializeStats();
    this.startHealthChecks();
  }

  private createLoadBalancer(): ILoadBalancer {
    const { loadBalancingStrategy, loadBalancingConfig } = this.config;
    
    switch (loadBalancingStrategy) {
      case 'round-robin':
        return new RoundRobinLoadBalancer(loadBalancingConfig || {});
      case 'least-loaded':
      default:
        return new LeastLoadedBalancer(loadBalancingConfig || {});
    }
  }

  private initializeStats(): ChannelHandlerStats {
    return {
      totalChannels: 0,
      channelsByType: Object.values(ChannelType).reduce(
        (acc, type) => ({ ...acc, [type]: 0 }),
        {} as Record<ChannelType, number>
      ),
      activeChannels: 0,
      queuedMessages: 0,
      averageThroughput: 0,
      errorRate: 0,
      lastUpdated: new Date()
    };
  }

  private startHealthChecks(): void {
    if (this.healthCheckTimer !== null) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.healthCheckTimer = setTimeout(
      async () => {
        try {
          const health = await this.getHealth();
          this.emit('health', health);
          
          // Update stats based on health check
          this.stats.activeChannels = Object.values(health.channels)
            .filter(ch => ch.status === ChannelStatus.OPERATIONAL).length;
          this.stats.lastUpdated = new Date();
        } catch (error) {
          this.emit('error', error);
        }
        // Schedule next health check
        this.startHealthChecks();
      },
      this.config.healthCheckInterval
    );
  }

  public async registerChannel(channel: IChannelStrategy): Promise<void> {
    const config = channel.getConfig();
    const typeCount = this.getChannelsByType(config.type).length;

    if (typeCount >= (this.config.maxChannelsPerType || Infinity)) {
      throw NotificationError.channelCreationFailed(
        'channel-handler',
        config.id,
        `Maximum number of channels (${this.config.maxChannelsPerType}) reached for type ${config.type}`
      );
    }

    this.channels.set(config.id, channel);
    this.stats.totalChannels++;
    this.stats.channelsByType[config.type]++;
    this.emit('channel:registered', config);
  }

  public async unregisterChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      const config = channel.getConfig();
      await channel.dispose();
      this.channels.delete(channelId);
      this.stats.totalChannels--;
      this.stats.channelsByType[config.type]--;
      this.emit('channel:unregistered', config);
    }
  }

  public getChannels(): IChannelStrategy[] {
    return Array.from(this.channels.values());
  }

  public getChannelsByType(type: ChannelType): IChannelStrategy[] {
    return this.getChannels().filter(channel => channel.getConfig().type === type);
  }

  public async send(message: IMessage): Promise<void> {
    const availableChannels = await this.getAvailableChannelsForMessage(message);
    
    if (!availableChannels.length) {
      throw NotificationError.channelUnavailable(
        'channel-handler',
        'No suitable channels available for message'
      );
    }

    try {
      const { channel } = await this.loadBalancer.selectChannel(message, availableChannels);
      await channel.send(message);
      this.stats.queuedMessages++;
      this.emit('message:sent', { messageId: message.getId(), channelId: channel.getConfig().id });
    } catch (error) {
      this.emit('message:failed', { messageId: message.getId(), error });
      throw error;
    }
  }

  private async getAvailableChannelsForMessage(message: IMessage): Promise<IChannelStrategy[]> {
    const availableChannels: IChannelStrategy[] = [];

    for (const channel of this.channels.values()) {
      try {
        if (await channel.canHandle(message)) {
          const health = await channel.checkHealth();
          if (health.status === ChannelStatus.OPERATIONAL) {
            availableChannels.push(channel);
          }
        }
      } catch (error) {
        this.emit('error', { channelId: channel.getConfig().id, error });
      }
    }

    return availableChannels;
  }

  public async canHandle(message: IMessage): Promise<boolean> {
    const availableChannels = await this.getAvailableChannelsForMessage(message);
    return availableChannels.length > 0;
  }

  public async getMetrics(): Promise<{
    channels: Record<string, ChannelMetrics>;
    overall: {
      messagesSentTotal: number;
      messagesFailedTotal: number;
      averageLatency: number;
      errorRate: number;
    };
  }> {
    const channelMetrics: Record<string, ChannelMetrics> = {};
    let totalSent = 0;
    let totalFailed = 0;
    let totalLatency = 0;
    let channelCount = 0;

    for (const channel of this.channels.values()) {
      try {
        const metrics = await channel.getMetrics();
        channelMetrics[channel.getConfig().id] = metrics;
        totalSent += metrics.messagesSentTotal;
        totalFailed += metrics.messagesFailedTotal;
        totalLatency += metrics.averageLatency;
        channelCount++;
      } catch (error) {
        this.emit('error', { channelId: channel.getConfig().id, error });
      }
    }

    return {
      channels: channelMetrics,
      overall: {
        messagesSentTotal: totalSent,
        messagesFailedTotal: totalFailed,
        averageLatency: channelCount ? totalLatency / channelCount : 0,
        errorRate: totalSent ? totalFailed / totalSent : 0
      }
    };
  }

  public async getHealth(): Promise<{
    channels: Record<string, ChannelHealth>;
    overall: {
      status: ChannelStatus;
      healthyChannels: number;
      totalChannels: number;
    };
  }> {
    const channelHealth: Record<string, ChannelHealth> = {};
    let healthyChannels = 0;

    for (const channel of this.channels.values()) {
      try {
        const health = await channel.checkHealth();
        channelHealth[channel.getConfig().id] = health;
        if (health.status === ChannelStatus.OPERATIONAL) {
          healthyChannels++;
        }
      } catch (error) {
        this.emit('error', { channelId: channel.getConfig().id, error });
      }
    }

    const overallStatus = healthyChannels === 0 ? ChannelStatus.DOWN :
      healthyChannels < this.channels.size ? ChannelStatus.DEGRADED :
      ChannelStatus.OPERATIONAL;

    return {
      channels: channelHealth,
      overall: {
        status: overallStatus,
        healthyChannels,
        totalChannels: this.channels.size
      }
    };
  }

  public async getLoadBalancingMetrics(): Promise<{
    channels: Record<string, LoadBalancingMetrics>;
    overall: {
      totalLoad: number;
      queueUtilization: number;
      channelUtilization: number;
    };
  }> {
    const channelMetrics: Record<string, LoadBalancingMetrics> = {};
    
    for (const channel of this.channels.values()) {
      try {
        const metrics = await channel.getLoadMetrics();
        channelMetrics[channel.getConfig().id] = metrics;
      } catch (error) {
        this.emit('error', { channelId: channel.getConfig().id, error });
      }
    }

    const overall = await this.loadBalancer.getMetrics();

    return {
      channels: channelMetrics,
      overall
    };
  }

  public async updateConfig(config: Partial<ChannelHandlerConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config
    };

    if (config.loadBalancingStrategy || config.loadBalancingConfig) {
      this.loadBalancer = this.createLoadBalancer();
    }

    if (config.healthCheckInterval) {
      this.startHealthChecks();
    }

    this.emit('config:updated', this.config);
  }

  public getStats(): ChannelHandlerStats {
    return { ...this.stats };
  }

  public async dispose(): Promise<void> {
    if (this.healthCheckTimer !== null) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    await Promise.all(
      Array.from(this.channels.values()).map(channel => channel.dispose())
    );

    this.channels.clear();
    this.loadBalancer.reset();
    this.removeAllListeners();
    this.stats = this.initializeStats();
  }
}