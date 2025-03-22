import { IChannelStrategy } from '../strategy.interface';
import { IMessage } from '../../message.interface';

/**
 * Load balancing configuration
 */
export interface LoadBalancerConfig {
  maxQueueSize: number;
  targetThroughput: number;
  balancingInterval: number;
}

/**
 * Load balancing decision result
 */
export interface BalancingResult {
  channel: IChannelStrategy;
  estimatedLatency: number;
  queuePosition?: number;
}

/**
 * Load balancer interface for implementing different balancing strategies
 */
export interface ILoadBalancer {
  /**
   * Select best channel for message delivery
   */
  selectChannel(
    message: IMessage,
    availableChannels: IChannelStrategy[]
  ): Promise<BalancingResult>;

  /**
   * Update load balancer configuration
   */
  updateConfig(config: Partial<LoadBalancerConfig>): void;

  /**
   * Get current load metrics
   */
  getMetrics(): Promise<{
    totalLoad: number;
    queueUtilization: number;
    channelUtilization: number;
  }>;

  /**
   * Reset load balancer state
   */
  reset(): void;
}

/**
 * Base implementation with common functionality
 */
export abstract class BaseLoadBalancer implements ILoadBalancer {
  protected config: LoadBalancerConfig;
  
  constructor(config: Partial<LoadBalancerConfig>) {
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 1000,
      targetThroughput: config.targetThroughput ?? 100,
      balancingInterval: config.balancingInterval ?? 1000
    };
  }

  public abstract selectChannel(
    message: IMessage,
    availableChannels: IChannelStrategy[]
  ): Promise<BalancingResult>;

  public updateConfig(config: Partial<LoadBalancerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  public abstract getMetrics(): Promise<{
    totalLoad: number;
    queueUtilization: number;
    channelUtilization: number;
  }>;

  public abstract reset(): void;

  /**
   * Calculate estimated latency for a channel
   */
  protected async calculateEstimatedLatency(
    channel: IChannelStrategy
  ): Promise<number> {
    const metrics = await channel.getMetrics();
    const loadMetrics = await channel.getLoadMetrics();
    
    // Factor in current load and historical latency
    const loadFactor = loadMetrics.queueSize / this.config.maxQueueSize;
    const baseLatency = metrics.averageLatency || 0;
    
    return baseLatency * (1 + loadFactor);
  }

  /**
   * Check if channel can handle more load
   */
  protected async canHandleLoad(channel: IChannelStrategy): Promise<boolean> {
    const loadMetrics = await channel.getLoadMetrics();
    return loadMetrics.queueSize < this.config.maxQueueSize;
  }
}