export * from './api.service';
export * from './base.service';
export * from './logger.service';
export * from './metrics.service';
export * from './monitoring.service';
export * from './rate-limiter.service';

// Re-export service interfaces
export * from '../types/api';
export * from '../types/monitoring';

// Export factory functions
import { DefaultApiService } from './api.service';
import { RateLimiterService } from './rate-limiter.service';
import { MonitoringService } from './monitoring.service';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { DiscordClient, MonitoringOptions } from '../types';
import { RateLimitConfig } from './rate-limiter.service';

export function createApiService(client: DiscordClient) {
  return new DefaultApiService(client);
}

export function createMonitoringService(
  client: DiscordClient, 
  options?: MonitoringOptions
) {
  return new MonitoringService(client, options);
}

export function createLoggerService(
  client: DiscordClient, 
  options?: Partial<import('../types').LoggerConfig>
) {
  return new LoggerService(client, options);
}

export function createMetricsService(
  client: DiscordClient, 
  prefix?: string
) {
  return new MetricsService(client, prefix);
}

export function createRateLimiterService(
  client: DiscordClient,
  config?: RateLimitConfig
) {
  return new RateLimiterService(client, config);
}