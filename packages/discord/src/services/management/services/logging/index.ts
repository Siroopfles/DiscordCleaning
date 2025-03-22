// Interfaces
export * from '../../interfaces/logging/logger.interface';
export * from '../../interfaces/logging/formatter.interface';
export * from '../../interfaces/logging/transport.interface';
export * from '../../interfaces/logging/logger-factory.interface';

// Base Classes
export * from './abstract-logger.service';

// Factory
export * from './logger.factory';

// Adapters
export * from './adapters/winston-logger.adapter';
export * from './adapters/bunyan-logger.adapter';

// Transports
export * from './transports/console.transport';

// Formatters
export * from './formatters/basic.formatter';

// Default logger configuration
export const DEFAULT_LOGGER_CONFIG = {
  level: 'info',
  transports: [],
  metadata: {
    service: '@newboom/discord'
  }
};