import { ApiResponse } from '../../../../types/api';
import { RequestContext } from './request.interface';
import { RestError } from './rest.interface';

export interface ResponseContext<T = unknown> {
  request: RequestContext;
  response: ApiResponse<T>;
  timestamp: number;
  duration: number;
  cached: boolean;
}

export interface ResponseHandler {
  handle<T>(context: ResponseContext<T>): Promise<ResponseContext<T>>;
  setNext(handler: ResponseHandler): ResponseHandler;
}

export interface ResponseMiddleware {
  pre?<T>(context: ResponseContext<T>): Promise<ResponseContext<T>>;
  post?<T>(context: ResponseContext<T>): Promise<ResponseContext<T>>;
  onError?(error: RestError, context: ResponseContext): Promise<void>;
}

export interface ResponseValidator {
  validate<T>(context: ResponseContext<T>): Promise<void>;
}

export interface CacheStrategy {
  shouldCache(context: ResponseContext): boolean;
  getCacheKey(context: RequestContext): string;
  getTTL(context: ResponseContext): number;
}

export interface MetricsCollector {
  recordDuration(context: ResponseContext): void;
  recordError(error: RestError, context: ResponseContext): void;
  recordCacheHit(context: ResponseContext): void;
  recordCacheMiss(context: ResponseContext): void;
}