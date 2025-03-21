export * from './api.service';
export * from './rate-limiter.service';
export * from './monitoring.service';

// Re-export service interfaces
export * from '../types/api';

// Export factory functions
import { DefaultApiService } from './api.service';
import { RateLimiterService } from './rate-limiter.service';
import { MonitoringService } from './monitoring.service';
import { Logger } from '../types';

export function createApiService(baseURL: string, logger?: Logger) {
  return new DefaultApiService(baseURL, logger);
}

export function createMonitoringService(logger?: Logger) {
  return new MonitoringService(logger);
}

export function createRateLimiterService(maxAttempts = 5, windowMs = 60000) {
  return new RateLimiterService({ maxAttempts, windowMs });
}