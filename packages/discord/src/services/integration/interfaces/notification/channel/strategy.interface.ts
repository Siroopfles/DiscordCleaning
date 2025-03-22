import { IMessage } from '../message.interface';
import { ChannelConfig, ChannelType, ChannelStatus } from '../types/channel.types';
import { NotificationError, NotificationErrorCode } from '../errors/notification.error';

export interface ChannelMetrics {
  messagesSentTotal: number;
  messagesFailedTotal: number;
  averageLatency: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface ChannelHealth {
  status: ChannelStatus;
  lastChecked: Date;
  errorCount: number;
  latency: number;
  metadata?: Record<string, unknown>;
}

export interface LoadBalancingMetrics {
  activeConnections: number;
  queueSize: number;
  throughput: number; // messages per second
  lastBalanced: Date;
}

/**
 * Interface for channel type-specific handling strategies
 */
export interface IChannelStrategy {
  /**
   * Initialize channel with configuration
   */
  initialize(config: ChannelConfig): Promise<void>;

  /**
   * Send message through this channel
   */
  send(message: IMessage): Promise<void>;

  /**
   * Validate message can be handled by this channel
   */
  canHandle(message: IMessage): Promise<boolean>;

  /**
   * Get channel configuration
   */
  getConfig(): ChannelConfig;

  /**
   * Update channel configuration
   */
  updateConfig(config: Partial<ChannelConfig>): Promise<void>;

  /**
   * Get channel type
   */
  getType(): ChannelType;

  /**
   * Get channel metrics
   */
  getMetrics(): Promise<ChannelMetrics>;

  /**
   * Check channel health
   */
  checkHealth(): Promise<ChannelHealth>;

  /**
   * Test channel connectivity
   */
  testConnection(): Promise<boolean>;

  /**
   * Get load balancing metrics for this channel
   */
  getLoadMetrics(): Promise<LoadBalancingMetrics>;

  /**
   * Close channel and cleanup resources
   */
  dispose(): Promise<void>;
}

/**
 * Abstract base class for channel strategies
 * Implements common functionality and error handling
 */
export abstract class BaseChannelStrategy implements IChannelStrategy {
  protected config: ChannelConfig;
  protected metrics: ChannelMetrics;
  protected health: ChannelHealth;
  protected loadMetrics: LoadBalancingMetrics;

  constructor(config: ChannelConfig) {
    this.config = config;
    this.metrics = {
      messagesSentTotal: 0,
      messagesFailedTotal: 0,
      averageLatency: 0,
      errorRate: 0,
      lastUpdated: new Date()
    };
    this.health = {
      status: ChannelStatus.INITIALIZING,
      lastChecked: new Date(),
      errorCount: 0,
      latency: 0
    };
    this.loadMetrics = {
      activeConnections: 0,
      queueSize: 0,
      throughput: 0,
      lastBalanced: new Date()
    };
  }

  public async initialize(config: ChannelConfig): Promise<void> {
    this.config = config;
    this.health.status = ChannelStatus.INITIALIZING;
    try {
      await this.onInitialize();
      this.health.status = ChannelStatus.OPERATIONAL;
    } catch (error) {
      this.health.status = ChannelStatus.ERROR;
      this.health.errorCount++;
      throw error;
    }
  }

  protected abstract onInitialize(): Promise<void>;

  public async send(message: IMessage): Promise<void> {
    const start = Date.now();
    
    try {
      if (!await this.canHandle(message)) {
        throw NotificationError.channelIncompatible(
          this.config.id,
          this.config.id,
          message.getId(),
          `Channel ${this.config.id} cannot handle message ${message.getId()}`
        );
      }

      await this.onSend(message);
      
      // Update metrics
      this.metrics.messagesSentTotal++;
      const latency = Date.now() - start;
      this.metrics.averageLatency = 
        (this.metrics.averageLatency * (this.metrics.messagesSentTotal - 1) + latency) / 
        this.metrics.messagesSentTotal;
      this.metrics.lastUpdated = new Date();
      
      // Update load metrics
      this.loadMetrics.throughput = 
        this.metrics.messagesSentTotal / 
        ((Date.now() - this.loadMetrics.lastBalanced.getTime()) / 1000);

    } catch (error) {
      this.metrics.messagesFailedTotal++;
      this.metrics.errorRate = 
        this.metrics.messagesFailedTotal / this.metrics.messagesSentTotal;
      throw error;
    }
  }

  protected abstract onSend(message: IMessage): Promise<void>;

  public abstract canHandle(message: IMessage): Promise<boolean>;

  public getConfig(): ChannelConfig {
    return { ...this.config };
  }

  public async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config
    };
    await this.onConfigUpdate(config);
  }

  protected abstract onConfigUpdate(config: Partial<ChannelConfig>): Promise<void>;

  public getType(): ChannelType {
    return this.config.type;
  }

  public async getMetrics(): Promise<ChannelMetrics> {
    return { ...this.metrics };
  }

  public async checkHealth(): Promise<ChannelHealth> {
    const start = Date.now();
    
    try {
      await this.testConnection();
      this.health.latency = Date.now() - start;
      this.health.status = ChannelStatus.OPERATIONAL;
    } catch (error) {
      this.health.errorCount++;
      this.health.status = this.health.errorCount >= 3 ? 
        ChannelStatus.ERROR : 
        ChannelStatus.DEGRADED;
    }
    
    this.health.lastChecked = new Date();
    return { ...this.health };
  }

  public abstract testConnection(): Promise<boolean>;

  public async getLoadMetrics(): Promise<LoadBalancingMetrics> {
    return { ...this.loadMetrics };
  }

  public abstract dispose(): Promise<void>;
}