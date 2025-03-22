import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';
import { IMetricsService, MetricDefinition } from '../../interfaces/metrics';
import { ILoggerService } from '../../interfaces/logging/logger.interface';
import { IConfigService } from '../../interfaces/config/config-service.interface';
import { NotificationConfig, NotificationMetrics, ChannelMetric } from './types';
import { notificationMetrics } from './metrics';
import {
  notificationConfigSchema,
  channelsConfigSchema, 
  loadBalancingConfigSchema, 
  monitoringConfigSchema 
} from './config.schema';

const DEFAULT_CONFIG: NotificationConfig = {
  channels: {
    maxChannelsPerType: 10,
    healthCheckInterval: 30000,
    loadBalancing: {
      strategy: 'least-loaded',
      maxQueueSize: 1000,
      targetThroughput: 100,
      balancingInterval: 1000
    }
  },
  monitoring: {
    metricsInterval: 60000,
    errorThreshold: 0.1,
    performanceThreshold: 5000
  }
};

export class NotificationManagementService extends BaseService implements IMetricsService {
  private readonly metricsService: IMetricsService;
  private readonly configService: IConfigService;
  private readonly customLogger: ILoggerService;
  private config: NotificationConfig = DEFAULT_CONFIG;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(
    client: DiscordClient,
    metricsService: IMetricsService,
    configService: IConfigService,
    logger: ILoggerService
  ) {
    super(client);
    this.metricsService = metricsService;
    this.configService = configService;
    this.customLogger = logger;

    // Registreer alle metrics definities
    Object.values(notificationMetrics).forEach(metric => {
      this.registerMetric(metric);
    });
  }

  protected async initialize(): Promise<void> {
    try {
      // Registreer alle config schemas
      await this.configService.registerSchema('notification', notificationConfigSchema);
      await this.configService.registerSchema('notification.channels', channelsConfigSchema);
      await this.configService.registerSchema('notification.channels.loadBalancing', loadBalancingConfigSchema);
      await this.configService.registerSchema('notification.monitoring', monitoringConfigSchema);

      // Laad initiële configuratie
      await this.loadConfig();

      // Start metrics collection
      this.startMetricsCollection();

      this.customLogger.info('NotificationManagementService geïnitialiseerd', {
        component: 'NotificationManagementService',
        metricsCount: Object.keys(notificationMetrics).length
      });
    } catch (error) {
      this.customLogger.error('Fout bij initialisatie NotificationManagementService', {
        component: 'NotificationManagementService',
        error
      });
      throw error;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const loadedConfig = await this.configService.get<NotificationConfig>('notification');
      if (loadedConfig) {
        this.config = loadedConfig;
      }

      this.customLogger.info('Notification configuratie geladen', {
        component: 'NotificationManagementService',
        config: this.config
      });
    } catch (error) {
      this.customLogger.error('Fout bij laden notification configuratie', {
        component: 'NotificationManagementService',
        error
      });
      throw error;
    }
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        Object.entries(metrics).forEach(([name, value]) => {
          this.recordMetric(name, value.value, value.labels);
        });

        this.customLogger.debug('Metrics verzameld', {
          component: 'NotificationManagementService',
          metricsCount: Object.keys(metrics).length
        });
      } catch (error) {
        this.customLogger.error('Fout bij verzamelen metrics', {
          component: 'NotificationManagementService',
          error
        });
      }
    }, this.config.monitoring.metricsInterval);
  }

  private async collectMetrics(): Promise<Record<string, { value: number; labels?: Record<string, string> }>> {
    const metrics: Record<string, { value: number; labels?: Record<string, string> }> = {};
    const now = Date.now();

    try {
      // Basismetrics verzamelen
      metrics['notification_messages_sent'] = {
        value: this.stats.messagesSentTotal,
        labels: { status: 'success' }
      };

      metrics['notification_messages_failed'] = {
        value: this.stats.messagesFailedTotal,
        labels: { status: 'failed' }
      };

      metrics['notification_average_latency'] = {
        value: this.stats.averageLatency
      };

      metrics['notification_error_rate'] = {
        value: this.stats.errorRate
      };

      // Channel metrics verwerken
      Object.entries(this.stats.channelMetrics).forEach(([channelId, metric]) => {
        const channelMetric = metric as ChannelMetric;
        metrics[`notification_channel_messages_sent`] = {
          value: channelMetric.messagesSent,
          labels: { channel_id: channelId, type: channelMetric.type }
        };

        metrics[`notification_channel_messages_failed`] = {
          value: channelMetric.messagesFailed,
          labels: { channel_id: channelId, type: channelMetric.type }
        };

        metrics[`notification_channel_latency`] = {
          value: channelMetric.averageLatency,
          labels: { channel_id: channelId, type: channelMetric.type }
        };

        metrics[`notification_channel_queue_size`] = {
          value: channelMetric.queueSize,
          labels: { channel_id: channelId, type: channelMetric.type }
        };

        metrics[`notification_channel_throughput`] = {
          value: channelMetric.throughput,
          labels: { channel_id: channelId, type: channelMetric.type }
        };
      });

      return metrics;
    } catch (error) {
      this.customLogger.error('Fout bij verzamelen metrics', {
        component: 'NotificationManagementService',
        error
      });
      throw error;
    }
  }

  // Stats tracking
  private stats: NotificationMetrics = {
    messagesSentTotal: 0,
    messagesFailedTotal: 0,
    averageLatency: 0,
    errorRate: 0,
    channelMetrics: {}
  };

  public updateStats(update: Partial<NotificationMetrics>): void {
    this.stats = {
      ...this.stats,
      ...update,
      channelMetrics: {
        ...this.stats.channelMetrics,
        ...(update.channelMetrics || {})
      }
    };
  }

  // IMetricsService implementatie
  public registerMetric(definition: MetricDefinition): void {
    this.metricsService.registerMetric(definition);
  }

  public recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metricsService.recordMetric(name, value, labels);
  }

  public incrementCounter(name: string, labels?: Record<string, string>): void {
    this.metricsService.incrementCounter(name, labels);
  }

  public recordDuration(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.metricsService.recordDuration(name, durationMs, labels);
  }

  public setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.metricsService.setGauge(name, value, labels);
  }

  public async export(): Promise<string> {
    return this.metricsService.export();
  }

  // Cleanup
  public async dispose(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.customLogger.info('NotificationManagementService afgesloten', {
      component: 'NotificationManagementService'
    });
  }
}