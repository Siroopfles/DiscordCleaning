import { integrationServices, IntegrationServices } from '../index';
import { MonitoringService } from '../monitoring';
import { EventBusService } from '../events';
import { HealthService } from '../health';

import { Client } from 'discord.js';
import { DiscordClient, DiscordConfig, DiscordServices } from '../../../../types';

// Mock Discord client
// Create mock WebSocketManager
const mockWs = {
  ping: 42,
  packetQueue: [],
  destroyed: false,
  client: null as any,
  gateway: null as any,
  status: 0,
  shards: new Map(),
  debug: jest.fn(),
  destroy: jest.fn(),
  connect: jest.fn(),
  broadcast: jest.fn(),
  getGateway: jest.fn(),
  handlePacket: jest.fn(),
  // Add other required WebSocketManager properties as needed
} as const;

// Mock Discord client factory
function createMockDiscordClient(): DiscordClient {
  const client = new Client({ intents: [] });
  
  // Add required properties
  Object.defineProperties(client, {
    config: {
      value: {
        token: 'mock-token',
        clientId: 'mock-client-id'
      },
      writable: false
    },
    services: {
      value: {},
      writable: false
    },
    ws: {
      value: mockWs,
      writable: false
    },
    isReady: {
      value: () => true as const
    }
  });

  return client as DiscordClient;
}

// Mock other dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockMetricsExporter = {
  exportMetric: jest.fn(),
};

const mockPublisher = {
  publish: jest.fn(),
};

describe('Integration Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await integrationServices.destroy();
  });

  describe('Monitoring Service', () => {
    let monitoring: MonitoringService;

    beforeEach(async () => {
      await integrationServices.initialize({
        logger: mockLogger,
        client: createMockDiscordClient(),
        monitoring: {
          metricsExporter: mockMetricsExporter
        }
      });
      monitoring = integrationServices.monitoring;
    });

    it('should record and export metrics', () => {
      monitoring.recordMetric('test_metric', 42, 'gauge', { label: 'test' });
      
      expect(mockMetricsExporter.exportMetric).toHaveBeenCalledWith(
        'test_metric',
        42,
        { label: 'test' }
      );
    });

    it('should track resource usage', () => {
      const metrics = monitoring.getResourceMetrics();
      
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('uptimeSeconds');
    });

    it('should manage health status', () => {
      monitoring.updateHealthStatus('test', 'healthy', { detail: 'ok' });
      const status = monitoring.getHealthStatus();
      
      expect(status.details.test).toEqual(expect.objectContaining({
        status: 'healthy',
        detail: 'ok'
      }));
    });
  });

  describe('Event Bus Service', () => {
    let eventBus: EventBusService;

    beforeEach(async () => {
      await integrationServices.initialize({
        logger: mockLogger,
        client: createMockDiscordClient(),
        eventBus: {
          publisher: mockPublisher
        }
      });
      eventBus = integrationServices.eventBus;
    });

    it('should handle event emission and subscription', async () => {
      const mockHandler = jest.fn();
      const testEvent = { data: 'test' };

      eventBus.on('test:event', mockHandler);
      await eventBus.emit('test:event', testEvent);

      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'test:event',
        payload: testEvent
      }));
    });

    it('should track event correlations', async () => {
      const correlationId = 'test-correlation';
      const causationId = 'test-causation';

      await eventBus.emit('test:event', { data: 'test' }, correlationId, causationId);
      const related = eventBus.getCorrelatedEvents(correlationId);

      expect(related).toContain(causationId);
    });

    it('should handle event handler removal', () => {
      const mockHandler = jest.fn();
      
      eventBus.on('test:event', mockHandler);
      eventBus.off('test:event', mockHandler);
      
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Health Service', () => {
    let health: HealthService;

    beforeEach(async () => {
      const mockCheck = {
        name: 'test:check',
        check: jest.fn().mockResolvedValue({
          status: 'healthy',
          lastUpdate: Date.now()
        }),
        interval: 1000
      };

      await integrationServices.initialize({
        logger: mockLogger,
        client: createMockDiscordClient(),
        health: {
          checks: [mockCheck]
        }
      });
      health = integrationServices.health;
    });

    it('should run health checks', async () => {
      const status = await health.runAllChecks();
      
      expect(status.status).toBe('healthy');
      expect(status.details['test:check']).toBeDefined();
    });

    it('should handle check registration', () => {
      const newCheck = {
        name: 'another:check',
        check: jest.fn().mockResolvedValue({
          status: 'healthy',
          lastUpdate: Date.now()
        }),
        interval: 1000
      };

      health.registerCheck(newCheck);
      
      expect(() => health.runCheck('another:check')).not.toThrow();
    });

    it('should update overall status based on component health', async () => {
      const degradedCheck = {
        name: 'degraded:check',
        check: jest.fn().mockResolvedValue({
          status: 'degraded',
          lastUpdate: Date.now(),
          error: 'Test error'
        }),
        interval: 1000
      };

      health.registerCheck(degradedCheck);
      await health.runAllChecks();
      const status = health.getStatus();

      expect(status.status).toBe('degraded');
    });
  });

  describe('Integration Services Factory', () => {
    it('should maintain singleton instance', () => {
      const instance1 = IntegrationServices.getInstance();
      const instance2 = IntegrationServices.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize all services', async () => {
      await integrationServices.initialize({
        logger: mockLogger,
        client: createMockDiscordClient()
      });

      expect(() => integrationServices.monitoring).not.toThrow();
      expect(() => integrationServices.eventBus).not.toThrow();
      expect(() => integrationServices.health).not.toThrow();
    });

    it('should handle service dependencies', async () => {
      await integrationServices.initialize({
        logger: mockLogger,
        client: createMockDiscordClient(),
        monitoring: {
          metricsExporter: mockMetricsExporter
        },
        eventBus: {
          publisher: mockPublisher
        }
      });

      // Verify monitoring metrics flow to health checks
      const healthStatus = await integrationServices.health.runAllChecks();
      expect(healthStatus.details['monitoring']).toBeDefined();
      
      // Verify event bus connection
      expect(healthStatus.details['eventBus']).toBeDefined();
    });
  });
});