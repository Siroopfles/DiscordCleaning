export type LoadBalancingStrategy = 'round-robin' | 'least-loaded';

export interface LoadBalancingConfig {
  strategy: LoadBalancingStrategy;
  maxQueueSize: number;
  targetThroughput: number;
  balancingInterval: number;
}

export interface ChannelsConfig {
  maxChannelsPerType: number;
  healthCheckInterval: number;
  loadBalancing: LoadBalancingConfig;
}

export interface MonitoringConfig {
  metricsInterval: number;
  errorThreshold: number;
  performanceThreshold: number;
}

export interface NotificationConfig {
  channels: ChannelsConfig;
  monitoring: MonitoringConfig;
}

export interface ChannelMetric {
  type: string;
  status: string;
  messagesSent: number;
  messagesFailed: number;
  averageLatency: number;
  queueSize: number;
  throughput: number;
}

export interface NotificationMetrics {
  messagesSentTotal: number;
  messagesFailedTotal: number;
  averageLatency: number;
  errorRate: number;
  channelMetrics: Record<string, ChannelMetric>;
}