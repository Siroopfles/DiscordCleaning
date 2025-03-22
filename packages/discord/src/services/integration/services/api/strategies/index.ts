export * from './default-request.validator';
export * from './default-response.validator';
export * from './default-retry.strategy';
export * from './default-cache.strategy';
export * from './default-metrics.collector';

import { DiscordClient } from '../../../../../types';
import { DefaultRequestValidator } from './default-request.validator';
import { DefaultResponseValidator } from './default-response.validator';
import { DefaultRetryStrategy } from './default-retry.strategy';
import { DefaultCacheStrategy } from './default-cache.strategy';
import { DefaultMetricsCollector } from './default-metrics.collector';
import { ApiServiceConfig } from '../index';

export interface DefaultStrategyOptions {
  maxRetries?: number;
  baseRetryDelay?: number;
  maxRetryDelay?: number;
  defaultCacheTTL?: number;
  cachableMethods?: string[];
  excludedCachePaths?: string[];
  pathSpecificTTLs?: Array<{ path: RegExp; ttl: number }>;
}

export function createDefaultStrategies(
  client: DiscordClient,
  options: DefaultStrategyOptions = {}
): Omit<ApiServiceConfig, 'rest'> {
  const requestValidator = new DefaultRequestValidator();
  const responseValidator = new DefaultResponseValidator();
  const retryStrategy = new DefaultRetryStrategy(
    options.maxRetries,
    options.baseRetryDelay,
    options.maxRetryDelay
  );
  const cacheStrategy = new DefaultCacheStrategy(
    options.defaultCacheTTL,
    {
      cachableMethods: options.cachableMethods,
      excludedPaths: options.excludedCachePaths,
      pathTTLs: options.pathSpecificTTLs
    }
  );
  const metricsCollector = new DefaultMetricsCollector(client);

  return {
    requestValidator,
    responseValidator,
    retryStrategy,
    cacheStrategy,
    metricsCollector
  };
}