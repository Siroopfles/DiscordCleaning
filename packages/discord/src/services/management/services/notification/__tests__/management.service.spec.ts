import { NotificationManagementService } from '../management.service';
import { NotificationConfig, NotificationMetrics } from '../types';
import { IMetricsService } from '../../../interfaces/metrics';
import { ILoggerService } from '../../../interfaces/logging/logger.interface';
import { IConfigService } from '../../../interfaces/config/config-service.interface';
import { DiscordClient } from '../../../../../types';

// Test helper class om protected methods te kunnen testen
class TestableNotificationManagementService extends NotificationManagementService {
  public async testInitialize(): Promise<void> {
    return this.initialize();
  }
}

describe('NotificationManagementService', () => {
  let service: TestableNotificationManagementService;
  let mockMetricsService: Partial<IMetricsService>;
  let mockConfigService: Partial<IConfigService>;
  let mockLogger: Partial<ILoggerService>;
  let mockClient: Partial<DiscordClient>;

  const mockConfig: NotificationConfig = {
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

  beforeEach(() => {
    mockMetricsService = {
      registerMetric: jest.fn(),
      recordMetric: jest.fn(),
      incrementCounter: jest.fn(),
      recordDuration: jest.fn(),
      setGauge: jest.fn(),
      export: jest.fn().mockResolvedValue('')
    };

    mockConfigService = {
      get: jest.fn().mockResolvedValue(mockConfig),
      registerSchema: jest.fn().mockResolvedValue(true)
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      level: 'info',
      transports: []
    };

    mockClient = {
      services: {
        logger: mockLogger as ILoggerService
      }
    };

    service = new TestableNotificationManagementService(
      mockClient as DiscordClient,
      mockMetricsService as IMetricsService,
      mockConfigService as IConfigService,
      mockLogger as ILoggerService
    );
  });

  describe('initialization', () => {
    it('should register config schemas', async () => {
      await service.testInitialize();
      expect(mockConfigService.registerSchema).toHaveBeenCalledWith('notification', expect.any(Object));
    });

    it('should load initial config', async () => {
      await service.testInitialize();
      expect(mockConfigService.get).toHaveBeenCalledWith('notification');
    });

    it('should register metrics definitions', () => {
      expect(mockMetricsService.registerMetric).toHaveBeenCalled();
    });
  });

  describe('metrics collection', () => {
    it('should collect and record metrics', async () => {
      const mockMetrics: Partial<NotificationMetrics> = {
        messagesSentTotal: 100,
        messagesFailedTotal: 5,
        averageLatency: 150,
        errorRate: 0.05,
        channelMetrics: {
          'channel-1': {
            type: 'discord',
            status: 'operational',
            messagesSent: 50,
            messagesFailed: 2,
            averageLatency: 120,
            queueSize: 10,
            throughput: 5
          }
        }
      };

      service.updateStats(mockMetrics as NotificationMetrics);
      
      // Trigger metrics collection manually
      await service['collectMetrics']();

      expect(mockMetricsService.recordMetric).toHaveBeenCalledWith(
        'notification_messages_sent',
        100,
        expect.any(Object)
      );

      expect(mockMetricsService.recordMetric).toHaveBeenCalledWith(
        'notification_channel_messages_sent',
        50,
        expect.any(Object)
      );
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on dispose', async () => {
      await service.dispose();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'NotificationManagementService afgesloten',
        expect.any(Object)
      );
    });
  });
});