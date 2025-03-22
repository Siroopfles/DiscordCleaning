import { IChannelStrategy } from '../strategy.interface';
import { IMessage } from '../../message.interface';
import { BaseLoadBalancer, BalancingResult } from './load-balancer.interface';
import { NotificationError } from '../../errors/notification.error';

interface ChannelLoadInfo {
  channel: IChannelStrategy;
  currentLoad: number;
  predictedLoad: number;
  queueSize: number;
  lastUpdated: number;
}

/**
 * Least Loaded balancing strategy
 * Distributes load to channels with lowest current and predicted load
 */
export class LeastLoadedBalancer extends BaseLoadBalancer {
  private channelLoads: Map<string, ChannelLoadInfo> = new Map();
  private lastBalancingTime = Date.now();
  private totalMessagesProcessed = 0;

  /**
   * Select channel with lowest current and predicted load
   */
  public async selectChannel(
    message: IMessage,
    availableChannels: IChannelStrategy[]
  ): Promise<BalancingResult> {
    if (!availableChannels.length) {
      throw NotificationError.channelUnavailable(
        'least-loaded',
        'No channels available for message delivery'
      );
    }

    // Update load information for all channels
    await this.updateChannelLoads(availableChannels);

    // Find channel with lowest effective load
    let selectedChannel: IChannelStrategy | null = null;
    let lowestEffectiveLoad = Number.MAX_VALUE;
    let estimatedLatency = 0;

    for (const channel of availableChannels) {
      const loadInfo = this.channelLoads.get(channel.getConfig().id);
      if (!loadInfo) continue;

      // Skip overloaded channels
      if (!await this.canHandleLoad(channel)) continue;

      // Calculate effective load considering both current and predicted load
      const effectiveLoad = this.calculateEffectiveLoad(loadInfo);
      
      if (effectiveLoad < lowestEffectiveLoad) {
        selectedChannel = channel;
        lowestEffectiveLoad = effectiveLoad;
        estimatedLatency = await this.calculateEstimatedLatency(channel);
      }
    }

    if (!selectedChannel) {
      const totalQueueSize = Array.from(this.channelLoads.values())
        .reduce((sum, info) => sum + info.queueSize, 0);
      
      throw NotificationError.channelOverloaded(
        'least-loaded',
        'all',
        totalQueueSize,
        this.config.maxQueueSize * availableChannels.length
      );
    }

    // Update metrics
    this.totalMessagesProcessed++;
    this.lastBalancingTime = Date.now();

    // Update predicted load for selected channel
    const loadInfo = this.channelLoads.get(selectedChannel.getConfig().id);
    if (loadInfo) {
      loadInfo.predictedLoad += 1;
      loadInfo.queueSize += 1;
    }

    return {
      channel: selectedChannel,
      estimatedLatency,
      queuePosition: loadInfo?.queueSize
    };
  }

  /**
   * Update load information for all channels
   */
  private async updateChannelLoads(channels: IChannelStrategy[]): Promise<void> {
    const currentTime = Date.now();
    
    for (const channel of channels) {
      const channelId = channel.getConfig().id;
      const metrics = await channel.getMetrics();
      const loadMetrics = await channel.getLoadMetrics();
      
      const loadInfo: ChannelLoadInfo = {
        channel,
        currentLoad: loadMetrics.throughput / this.config.targetThroughput,
        predictedLoad: 0, // Reset predicted load periodically
        queueSize: loadMetrics.queueSize,
        lastUpdated: currentTime
      };

      this.channelLoads.set(channelId, loadInfo);
    }

    // Clean up old entries
    for (const [channelId, loadInfo] of this.channelLoads.entries()) {
      if (loadInfo.lastUpdated < currentTime - 60000) { // 1 minute timeout
        this.channelLoads.delete(channelId);
      }
    }
  }

  /**
   * Calculate effective load considering multiple factors
   */
  private calculateEffectiveLoad(loadInfo: ChannelLoadInfo): number {
    const currentLoadWeight = 0.6;
    const predictedLoadWeight = 0.4;
    const queueFactor = loadInfo.queueSize / this.config.maxQueueSize;

    return (
      loadInfo.currentLoad * currentLoadWeight +
      loadInfo.predictedLoad * predictedLoadWeight
    ) * (1 + queueFactor);
  }

  /**
   * Get current load balancing metrics
   */
  public async getMetrics(): Promise<{
    totalLoad: number;
    queueUtilization: number;
    channelUtilization: number;
  }> {
    const timeSinceLastBalance = (Date.now() - this.lastBalancingTime) / 1000;
    const currentThroughput = this.totalMessagesProcessed / timeSinceLastBalance;

    let totalQueueSize = 0;
    let totalCurrentLoad = 0;
    
    for (const loadInfo of this.channelLoads.values()) {
      totalQueueSize += loadInfo.queueSize;
      totalCurrentLoad += loadInfo.currentLoad;
    }

    const channelCount = this.channelLoads.size || 1;

    return {
      totalLoad: totalCurrentLoad / channelCount,
      queueUtilization: totalQueueSize / (this.config.maxQueueSize * channelCount),
      channelUtilization: currentThroughput / (this.config.targetThroughput * channelCount)
    };
  }

  /**
   * Reset balancer state
   */
  public reset(): void {
    this.channelLoads.clear();
    this.totalMessagesProcessed = 0;
    this.lastBalancingTime = Date.now();
  }
}