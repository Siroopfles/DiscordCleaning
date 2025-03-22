import { MetricDefinition, MetricType } from '../../interfaces/metrics';

export const notificationMetrics: Record<string, MetricDefinition> = {
  // Message metrics
  notification_messages_total: {
    name: 'notification_messages_total',
    help: 'Total number of notification messages processed',
    type: MetricType.COUNTER,
    labelNames: ['status', 'channel_type']
  },
  notification_message_duration_seconds: {
    name: 'notification_message_duration_seconds',
    help: 'Duration of notification message processing in seconds',
    type: MetricType.HISTOGRAM,
    labelNames: ['channel_type'],
    buckets: [0.1, 0.5, 1, 2, 5]
  },

  // Channel metrics
  notification_channels_total: {
    name: 'notification_channels_total',
    help: 'Total number of notification channels',
    type: MetricType.GAUGE,
    labelNames: ['type', 'status']
  },
  notification_channel_queue_size: {
    name: 'notification_channel_queue_size',
    help: 'Current size of notification channel queues',
    type: MetricType.GAUGE,
    labelNames: ['channel_id', 'channel_type']
  },
  notification_channel_throughput: {
    name: 'notification_channel_throughput',
    help: 'Messages processed per second by notification channel',
    type: MetricType.GAUGE,
    labelNames: ['channel_id', 'channel_type']
  },

  // Error metrics
  notification_errors_total: {
    name: 'notification_errors_total',
    help: 'Total number of notification errors',
    type: MetricType.COUNTER,
    labelNames: ['error_type', 'channel_type']
  },
  notification_error_rate: {
    name: 'notification_error_rate',
    help: 'Rate of notification errors per second',
    type: MetricType.GAUGE,
    labelNames: ['channel_type']
  },

  // Health metrics
  notification_health_status: {
    name: 'notification_health_status',
    help: 'Health status of notification system (0=down, 1=degraded, 2=operational)',
    type: MetricType.GAUGE,
    labelNames: ['channel_type']
  },
  notification_healthy_channels: {
    name: 'notification_healthy_channels',
    help: 'Number of healthy notification channels',
    type: MetricType.GAUGE,
    labelNames: ['channel_type']
  },

  // Load balancing metrics
  notification_load_balance_operations: {
    name: 'notification_load_balance_operations',
    help: 'Number of load balancing operations performed',
    type: MetricType.COUNTER,
    labelNames: ['strategy']
  },
  notification_channel_utilization: {
    name: 'notification_channel_utilization',
    help: 'Utilization percentage of notification channels',
    type: MetricType.GAUGE,
    labelNames: ['channel_id', 'channel_type']
  }
};