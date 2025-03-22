import { DiscordClient, MonitoringOptions } from '../../types';
import { IBaseService, IServiceConstructor } from './interfaces/base.service';
import { IMonitoring, IMonitoringFactory } from './interfaces/monitoring.interface';
import { IRateLimiter, IRateLimitConfig, IRateLimiterFactory } from './interfaces/rate-limiter.interface';
import { BaseService } from './services/base.service';
import { MonitoringService } from './services/monitoring.service';
import { RateLimiterService } from './services/rate-limiter.service';

// Extend global scope for Discord client
declare global {
  var discordClient: DiscordClient | undefined;
}

// Re-export interfaces
export {
  IBaseService,
  IServiceConstructor,
  IMonitoring,
  IMonitoringFactory,
  IRateLimiter,
  IRateLimitConfig,
  IRateLimiterFactory
};

// Re-export base implementations
export { BaseService };

/**
 * Factory for creating monitoring service instances
 */
export const createMonitoringService: IMonitoringFactory = {
  createMonitoring: (options?: MonitoringOptions): IMonitoring => {
    if (!global.discordClient) {
      throw new Error('Discord client not initialized. Call initializeCoreServices first.');
    }
    return new MonitoringService(global.discordClient, options);
  }
};

/**
 * Factory for creating rate limiter service instances
 */
export const createRateLimiterService: IRateLimiterFactory = {
  createRateLimiter: (config?: IRateLimitConfig): IRateLimiter => {
    if (!global.discordClient) {
      throw new Error('Discord client not initialized. Call initializeCoreServices first.');
    }
    return new RateLimiterService(global.discordClient, config);
  }
};

/**
 * Initialize core services for a Discord client
 */
export function initializeCoreServices(client: DiscordClient): void {
  global.discordClient = client;
}

// Types for service registration
export type CoreServiceType = IMonitoring | IRateLimiter;
export type CoreServiceFactory = IMonitoringFactory | IRateLimiterFactory;