import { IChannelStrategy } from '../strategy.interface';
import { IMessage } from '../../message.interface';
import { BaseLoadBalancer, BalancingResult } from './load-balancer.interface';
import { NotificationError } from '../../errors/notification.error';

/**
 * Round Robin load balancing strategy
 * Distributes load evenly across channels in sequential order
 */
export class RoundRobinLoadBalancer extends BaseLoadBalancer {
  private currentIndex = 0;
  private lastBalancingTime = Date.now();
  private totalMessagesProcessed = 0;

  /**
   * Select next available channel in round-robin fashion
   */
  public async selectChannel(
    message: IMessage,
    availableChannels: IChannelStrategy[]
  ): Promise<BalancingResult> {
    if (!availableChannels.length) {
      throw NotificationError.channelUnavailable(
        'round-robin',
        'No channels available for message delivery'
      );
    }

    let selectedChannel: IChannelStrategy | null = null;
    let startIndex = this.currentIndex;
    let estimatedLatency = 0;

    // Try each channel in sequence until we find one that can handle the load
    do {
      const channel = availableChannels[this.currentIndex];
      
      if (await this.canHandleLoad(channel)) {
        selectedChannel = channel;
        estimatedLatency = await this.calculateEstimatedLatency(channel);
        break;
      }

      // Move to next channel
      this.currentIndex = (this.currentIndex + 1) % availableChannels.length;
    } while (this.currentIndex !== startIndex);

    if (!selectedChannel) {
      const queueSizes = await Promise.all(availableChannels.map(c => c.getLoadMetrics().then(m => m.queueSize)));
      const totalQueue = queueSizes.reduce((a, b) => a + b, 0);
      throw NotificationError.channelOverloaded(
        'round-robin',
        'all',
        totalQueue,
        this.config.maxQueueSize * availableChannels.length
      );
    }

    // Update metrics
    this.totalMessagesProcessed++;
    this.lastBalancingTime = Date.now();

    // Move to next channel for next request
    this.currentIndex = (this.currentIndex + 1) % availableChannels.length;

    return {
      channel: selectedChannel,
      estimatedLatency,
      queuePosition: this.totalMessagesProcessed
    };
  }

  /**
   * Get load balancing metrics
   */
  public async getMetrics(): Promise<{
    totalLoad: number;
    queueUtilization: number;
    channelUtilization: number;
  }> {
    const timeSinceLastBalance = (Date.now() - this.lastBalancingTime) / 1000;
    const currentThroughput = this.totalMessagesProcessed / timeSinceLastBalance;

    return {
      totalLoad: currentThroughput / this.config.targetThroughput,
      queueUtilization: this.totalMessagesProcessed / this.config.maxQueueSize,
      channelUtilization: currentThroughput / this.config.targetThroughput
    };
  }

  /**
   * Reset balancer state
   */
  public reset(): void {
    this.currentIndex = 0;
    this.totalMessagesProcessed = 0;
    this.lastBalancingTime = Date.now();
  }
}