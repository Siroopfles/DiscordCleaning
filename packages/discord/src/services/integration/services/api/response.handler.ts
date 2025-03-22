import {
  ResponseContext,
  ResponseHandler,
  ResponseMiddleware,
  ResponseValidator,
  CacheStrategy,
  MetricsCollector,
  RestError
} from '../../interfaces/api';
import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';

export class BaseResponseHandler extends BaseService implements ResponseHandler {
  private nextHandler: ResponseHandler | null = null;

  constructor(client: DiscordClient) {
    super(client);
  }

  protected async initialize(): Promise<void> {
    this.log('debug', 'Initializing response handler');
  }

  async handle<T>(context: ResponseContext<T>): Promise<ResponseContext<T>> {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    return context;
  }

  setNext(handler: ResponseHandler): ResponseHandler {
    this.nextHandler = handler;
    return handler;
  }
}

export class ValidationResponseHandler extends BaseResponseHandler {
  private readonly validator: ResponseValidator;

  constructor(client: DiscordClient, validator: ResponseValidator) {
    super(client);
    this.validator = validator;
  }

  async handle<T>(context: ResponseContext<T>): Promise<ResponseContext<T>> {
    try {
      await this.validator.validate(context);
      return super.handle(context);
    } catch (error) {
      this.log('error', 'Response validation failed', { error, context });
      throw error;
    }
  }
}

export class CacheResponseHandler extends BaseResponseHandler {
  private readonly cacheStrategy: CacheStrategy;
  private readonly cache: Map<string, { data: any; expires: number }>;

  constructor(client: DiscordClient, cacheStrategy: CacheStrategy) {
    super(client);
    this.cacheStrategy = cacheStrategy;
    this.cache = new Map();
  }

  async handle<T>(context: ResponseContext<T>): Promise<ResponseContext<T>> {
    const cacheKey = this.cacheStrategy.getCacheKey(context.request);
    const cached = this.cache.get(cacheKey);

    // Check cache
    if (cached && cached.expires > Date.now()) {
      return {
        ...context,
        response: cached.data,
        cached: true,
      };
    }

    // Process response
    const result = await super.handle(context);

    // Cache if strategy allows
    if (this.cacheStrategy.shouldCache(result)) {
      const ttl = this.cacheStrategy.getTTL(result);
      this.cache.set(cacheKey, {
        data: result.response,
        expires: Date.now() + ttl,
      });
    }

    return result;
  }
}

export class MetricsResponseHandler extends BaseResponseHandler {
  private readonly metricsCollector: MetricsCollector;

  constructor(client: DiscordClient, metricsCollector: MetricsCollector) {
    super(client);
    this.metricsCollector = metricsCollector;
  }

  async handle<T>(context: ResponseContext<T>): Promise<ResponseContext<T>> {
    try {
      const result = await super.handle(context);
      
      this.metricsCollector.recordDuration(result);
      if (result.cached) {
        this.metricsCollector.recordCacheHit(result);
      } else {
        this.metricsCollector.recordCacheMiss(result);
      }

      return result;
    } catch (error) {
      const restError = error as RestError;
      this.metricsCollector.recordError(restError, context);
      throw error;
    }
  }
}

export class MiddlewareResponseHandler extends BaseResponseHandler {
  private readonly middleware: ResponseMiddleware;

  constructor(client: DiscordClient, middleware: ResponseMiddleware) {
    super(client);
    this.middleware = middleware;
  }

  async handle<T>(context: ResponseContext<T>): Promise<ResponseContext<T>> {
    try {
      if (this.middleware.pre) {
        context = await this.middleware.pre(context);
      }

      const result = await super.handle(context);

      if (this.middleware.post) {
        return await this.middleware.post(result);
      }

      return result;
    } catch (error) {
      const restError = error as RestError;
      if (this.middleware.onError) {
        await this.middleware.onError(restError, context);
      }
      throw error;
    }
  }
}

export function createResponseHandlerChain(
  client: DiscordClient,
  validator: ResponseValidator,
  cacheStrategy: CacheStrategy,
  metricsCollector: MetricsCollector,
  middlewares: ResponseMiddleware[] = []
): ResponseHandler {
  // Create base handler
  const baseHandler = new BaseResponseHandler(client);
  let currentHandler: ResponseHandler = baseHandler;

  // Add validation handler
  const validationHandler = new ValidationResponseHandler(client, validator);
  currentHandler.setNext(validationHandler);
  currentHandler = validationHandler;

  // Add cache handler
  const cacheHandler = new CacheResponseHandler(client, cacheStrategy);
  currentHandler.setNext(cacheHandler);
  currentHandler = cacheHandler;

  // Add metrics handler
  const metricsHandler = new MetricsResponseHandler(client, metricsCollector);
  currentHandler.setNext(metricsHandler);
  currentHandler = metricsHandler;

  // Add middleware handlers
  for (const middleware of middlewares) {
    const middlewareHandler = new MiddlewareResponseHandler(client, middleware);
    currentHandler.setNext(middlewareHandler);
    currentHandler = middlewareHandler;
  }

  return baseHandler;
}