import { RestError } from './rest.interface';

export interface RequestContext {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

export interface RequestHandler {
  handle(context: RequestContext): Promise<RequestContext>;
  setNext(handler: RequestHandler): RequestHandler;
}

export interface RequestMiddleware {
  pre?(context: RequestContext): Promise<RequestContext>;
  post?(context: RequestContext, error?: RestError): Promise<RequestContext>;
  onError?(error: RestError, context: RequestContext): Promise<void>;
}

export interface RequestValidator {
  validate(context: RequestContext): Promise<void>;
}

export interface RetryStrategy {
  shouldRetry(error: RestError, context: RequestContext): boolean;
  getDelay(retryCount: number): number;
}