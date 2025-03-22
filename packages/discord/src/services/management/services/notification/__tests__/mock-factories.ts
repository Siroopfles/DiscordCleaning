import { IMetricsService } from '../../../interfaces/metrics';
import { ILoggerService } from '../../../interfaces/logging/logger.interface';
import { IConfigService } from '../../../interfaces/config/config-service.interface';

export function createMockMetricsService(): jest.Mocked<IMetricsService> {
  return {
    registerMetric: jest.fn(),
    recordMetric: jest.fn(),
    incrementCounter: jest.fn(),
    recordDuration: jest.fn(),
    setGauge: jest.fn(),
    export: jest.fn()
  } as jest.Mocked<IMetricsService>;
}

export function createMockLoggerService(): jest.Mocked<ILoggerService> {
  return {
    level: 'info',
    transports: [],
    formatter: undefined,
    debug: jest.fn().mockResolvedValue(undefined),
    info: jest.fn().mockResolvedValue(undefined),
    warn: jest.fn().mockResolvedValue(undefined),
    error: jest.fn().mockResolvedValue(undefined),
    addTransport: jest.fn().mockResolvedValue(undefined),
    removeTransport: jest.fn().mockResolvedValue(undefined),
    setFormatter: jest.fn(),
    dependencies: {},
    serviceId: 'logger-test',
    initialize: jest.fn().mockResolvedValue(undefined),
    updateConfig: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    onDestroy: jest.fn().mockResolvedValue(undefined),
    updateDependencies: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined)
  } as jest.Mocked<ILoggerService>;
}

export function createMockConfigService(): jest.Mocked<IConfigService> {
  return {
    validator: {
      validateSchema: jest.fn(),
      validateValue: jest.fn()
    },
    providers: new Map(),
    registerProvider: jest.fn(),
    removeProvider: jest.fn(),
    updateProvider: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    validate: jest.fn(),
    has: jest.fn(),
    reload: jest.fn(),
    getAll: jest.fn(),
    registerSchema: jest.fn(),
    onConfigChange: jest.fn(),
    removeChangeListener: jest.fn(),
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
    snapshot: jest.fn()
  } as jest.Mocked<IConfigService>;
}