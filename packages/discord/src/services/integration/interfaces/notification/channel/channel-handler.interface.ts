import { IMessage } from '../message.interface';
import { ChannelConfig, ChannelType, ChannelStatus } from '../types/channel.types';
import { IChannelStrategy, ChannelMetrics, ChannelHealth, LoadBalancingMetrics } from './strategy.interface';

/**
 * Channel Handler configuration
 */
export interface ChannelHandlerConfig {
  maxChannelsPerType?: number;
  healthCheckInterval?: number; // milliseconds
  loadBalancingStrategy?: 'round-robin' | 'least-loaded' | 'priority';
  loadBalancingConfig?: {
    maxQueueSize?: number;
    targetThroughput?: number;
    balancingInterval?: number;
  };
}

/**
 * Channel Handler statistics
 */
export interface ChannelHandlerStats {
  totalChannels: number;
  channelsByType: Record<ChannelType, number>;
  activeChannels: number;
  queuedMessages: number;
  averageThroughput: number;
  errorRate: number;
  lastUpdated: Date;
}

/**
 * Channel Handler Service Interface
 */
export interface IChannelHandler {
  /**
   * Register a new channel strategy
   */
  registerChannel(channel: IChannelStrategy): Promise<void>;

  /**
   * Unregister a channel strategy
   */
  unregisterChannel(channelId: string): Promise<void>;

  /**
   * Get all registered channels
   */
  getChannels(): IChannelStrategy[];

  /**
   * Get channels by type
   */
  getChannelsByType(type: ChannelType): IChannelStrategy[];

  /**
   * Send message through appropriate channels
   */
  send(message: IMessage): Promise<void>;

  /**
   * Check if message can be handled
   */
  canHandle(message: IMessage): Promise<boolean>;

  /**
   * Get aggregated channel metrics
   */
  getMetrics(): Promise<{
    channels: Record<string, ChannelMetrics>;
    overall: {
      messagesSentTotal: number;
      messagesFailedTotal: number;
      averageLatency: number;
      errorRate: number;
    };
  }>;

  /**
   * Get channel health status
   */
  getHealth(): Promise<{
    channels: Record<string, ChannelHealth>;
    overall: {
      status: ChannelStatus;
      healthyChannels: number;
      totalChannels: number;
    };
  }>;

  /**
   * Get load balancing metrics
   */
  getLoadBalancingMetrics(): Promise<{
    channels: Record<string, LoadBalancingMetrics>;
    overall: {
      totalLoad: number;
      queueUtilization: number;
      channelUtilization: number;
    };
  }>;

  /**
   * Update channel handler configuration
   */
  updateConfig(config: Partial<ChannelHandlerConfig>): Promise<void>;

  /**
   * Get handler statistics
   */
  getStats(): ChannelHandlerStats;

  /**
   * Dispose of all channels and cleanup resources
   */
  dispose(): Promise<void>;
}