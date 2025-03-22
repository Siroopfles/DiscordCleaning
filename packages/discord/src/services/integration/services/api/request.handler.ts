import {
  RequestContext,
  RequestHandler,
  RequestMiddleware,
  RequestValidator,
  RetryStrategy,
  RestError
} from '../../interfaces/api';
import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';

export class BaseRequestHandler extends BaseService implements RequestHandler {
  private nextHandler: RequestHandler | null = null;

  constructor(client: DiscordClient) {
    super(client);
  }

  protected async initialize(): Promise<void> {
    this.log('debug', 'Initializing request handler');
  }

  async handle(context: RequestContext): Promise<RequestContext> {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    return context;
  }

  setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler;
  }
}

export class ValidationRequestHandler extends BaseRequestHandler {
  private readonly validator: RequestValidator;

  constructor(client: DiscordClient, validator: RequestValidator) {
    super(client);
    this.validator = validator;
  }

  async handle(context: RequestContext): Promise<RequestContext> {
    try {
      await this.validator.validate(context);
      return super.handle(context);
    } catch (error) {
      this.log('error', 'Request validation failed', { error, context });
      throw error;
    }
  }
}

export class RetryRequestHandler extends BaseRequestHandler {
  private readonly retryStrategy: RetryStrategy;

  constructor(client: DiscordClient, retryStrategy: RetryStrategy) {
    super(client);
    this.retryStrategy = retryStrategy;
  }

  async handle(context: RequestContext): Promise<RequestContext> {
    try {
      return await super.handle(context);
    } catch (error) {
      const restError = error as RestError;
      
      if (
        this.retryStrategy.shouldRetry(restError, context) &&
        context.retryCount < (context.headers?.['max-retries'] ? 
          parseInt(context.headers['max-retries']) : 3)
      ) {
        const delay = this.retryStrategy.getDelay(context.retryCount);
        this.log('warn', `Retrying request after ${delay}ms`, { 
          error: restError,
          retryCount: context.retryCount,
          delay 
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.handle({
          ...context,
          retryCount: context.retryCount + 1,
          timestamp: Date.now()
        });
      }

      throw error;
    }
  }
}

export class MiddlewareRequestHandler extends BaseRequestHandler {
  private readonly middleware: RequestMiddleware;

  constructor(client: DiscordClient, middleware: RequestMiddleware) {
    super(client);
    this.middleware = middleware;
  }

  async handle(context: RequestContext): Promise<RequestContext> {
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

export function createRequestHandlerChain(
  client: DiscordClient,
  validator: RequestValidator,
  retryStrategy: RetryStrategy,
  middlewares: RequestMiddleware[] = []
): RequestHandler {
  // Create base handler
  const baseHandler = new BaseRequestHandler(client);
  let currentHandler: RequestHandler = baseHandler;

  // Add validation handler
  const validationHandler = new ValidationRequestHandler(client, validator);
  currentHandler.setNext(validationHandler);
  currentHandler = validationHandler;

  // Add retry handler
  const retryHandler = new RetryRequestHandler(client, retryStrategy);
  currentHandler.setNext(retryHandler);
  currentHandler = retryHandler;

  // Add middleware handlers
  for (const middleware of middlewares) {
    const middlewareHandler = new MiddlewareRequestHandler(client, middleware);
    currentHandler.setNext(middlewareHandler);
    currentHandler = middlewareHandler;
  }

  return baseHandler;
}