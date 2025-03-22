import { DiscordClient } from '../../../../types';
import { RestService } from './rest.service';
import { createRequestHandlerChain } from './request.handler';
import { createResponseHandlerChain } from './response.handler';
import { createDefaultStrategies, DefaultStrategyOptions } from './strategies';
import {
  RestConfig,
  RequestValidator,
  ResponseValidator,
  RetryStrategy,
  CacheStrategy,
  MetricsCollector,
  RequestMiddleware,
  ResponseMiddleware
} from '../../interfaces/api';
import { DiscordApiService } from './discord-api.service';

export * from './rest.service';
export * from './request.handler';
export * from './response.handler';
export * from './strategies';
export * from './discord-api.service';

export interface ApiServiceConfig {
  rest: RestConfig;
  requestValidator: RequestValidator;
  responseValidator: ResponseValidator;
  retryStrategy: RetryStrategy;
  cacheStrategy: CacheStrategy;
  metricsCollector: MetricsCollector;
  requestMiddlewares?: RequestMiddleware[];
  responseMiddlewares?: ResponseMiddleware[];
}

export interface ApiServiceOptions extends DefaultStrategyOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  requestMiddlewares?: RequestMiddleware[];
  responseMiddlewares?: ResponseMiddleware[];
}

export function createRestService(
  client: DiscordClient,
  options: ApiServiceOptions
): RestService {
  // Create default strategies
  const strategies = createDefaultStrategies(client, options);

  // Create configuration
  const config: ApiServiceConfig = {
    rest: {
      baseURL: options.baseURL,
      timeout: options.timeout,
      headers: options.headers
    },
    ...strategies,
    requestMiddlewares: options.requestMiddlewares,
    responseMiddlewares: options.responseMiddlewares
  };

  // Create handler chains
  const requestHandler = createRequestHandlerChain(
    client,
    config.requestValidator,
    config.retryStrategy,
    config.requestMiddlewares
  );

  const responseHandler = createResponseHandlerChain(
    client,
    config.responseValidator,
    config.cacheStrategy,
    config.metricsCollector,
    config.responseMiddlewares
  );

  // Create and return REST service
  return new RestService(
    client,
    config.rest,
    requestHandler,
    responseHandler,
    config.metricsCollector
  );
}

// Factory helper voor het maken van de basis REST service met standaard Discord configuratie
export function createBaseRestService(client: DiscordClient): RestService {
  if (!client.config.apiBaseUrl) {
    throw new Error('API base URL is required in Discord client config');
  }

  return createRestService(client, {
    baseURL: client.config.apiBaseUrl,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    },
    maxRetries: 3,
    baseRetryDelay: 1000,
    maxRetryDelay: 10000,
    defaultCacheTTL: 300000, // 5 minuten
    cachableMethods: ['GET'],
    excludedCachePaths: [
      '/currency/transfer',
      '/currency/reward'
    ],
    pathSpecificTTLs: [
      { path: /\/leaderboard$/, ttl: 60000 }, // 1 minuut
      { path: /\/statistics$/, ttl: 300000 }, // 5 minuten
      { path: /\/categories/, ttl: 600000 } // 10 minuten
    ]
  });
}

// Factory voor het maken van de Discord-specifieke API service met alle endpoints
export function createDiscordApiService(client: DiscordClient): DiscordApiService {
  return new DiscordApiService(client);
}