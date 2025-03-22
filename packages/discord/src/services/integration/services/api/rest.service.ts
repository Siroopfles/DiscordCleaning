import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';
import { ApiResponse } from '../../../../types/api';
import {
  RestClient,
  RestConfig,
  RestError,
  RequestContext,
  ResponseContext,
  RequestHandler,
  ResponseHandler,
  MetricsCollector
} from '../../interfaces/api';

export class RestService extends BaseService implements RestClient {
  private readonly config: RestConfig;
  private readonly requestHandler: RequestHandler;
  private readonly responseHandler: ResponseHandler;
  private readonly metricsCollector: MetricsCollector;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(
    client: DiscordClient,
    config: RestConfig,
    requestHandler: RequestHandler,
    responseHandler: ResponseHandler,
    metricsCollector: MetricsCollector
  ) {
    super(client);
    this.config = config;
    this.requestHandler = requestHandler;
    this.responseHandler = responseHandler;
    this.metricsCollector = metricsCollector;
    this.headers = config.headers || {};
    this.timeout = config.timeout || 5000;
  }

  protected async initialize(): Promise<void> {
    this.log('info', 'Initializing REST service', {
      baseURL: this.config.baseURL,
      timeout: this.timeout,
    });
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({
      path,
      method: 'GET',
      timestamp: Date.now(),
      retryCount: 0,
      headers: this.headers,
    });
  }

  async post<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({
      path,
      method: 'POST',
      body: data,
      timestamp: Date.now(),
      retryCount: 0,
      headers: this.headers,
    });
  }

  async put<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({
      path,
      method: 'PUT',
      body: data,
      timestamp: Date.now(),
      retryCount: 0,
      headers: this.headers,
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({
      path,
      method: 'DELETE',
      timestamp: Date.now(),
      retryCount: 0,
      headers: this.headers,
    });
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  private async executeRequest<T>(context: RequestContext): Promise<ApiResponse<T>> {
    try {
      // Process request through chain of handlers
      const processedRequest = await this.requestHandler.handle(context);

      // Execute the HTTP request (implementation depends on HTTP client choice)
      const response = await this.makeHttpRequest<T>(processedRequest);

      // Create response context
      const responseContext: ResponseContext<T> = {
        request: processedRequest,
        response,
        timestamp: Date.now(),
        duration: Date.now() - context.timestamp,
        cached: false,
      };

      // Process response through chain of handlers
      const processedResponse = await this.responseHandler.handle(responseContext);

      // Record metrics
      this.metricsCollector.recordDuration(processedResponse);
      if (processedResponse.cached) {
        this.metricsCollector.recordCacheHit(processedResponse);
      } else {
        this.metricsCollector.recordCacheMiss(processedResponse);
      }

      return processedResponse.response;
    } catch (error) {
      const restError = this.normalizeError(error);
      this.metricsCollector.recordError(restError, {
        request: context,
        response: { success: false, error: restError.message },
        timestamp: Date.now(),
        duration: Date.now() - context.timestamp,
        cached: false,
      });
      throw restError;
    }
  }

  private async makeHttpRequest<T>(context: RequestContext): Promise<ApiResponse<T>> {
    const axios = (await import('axios')).default;

    try {
      const response = await axios({
        method: context.method,
        url: `${this.config.baseURL}${context.path}`,
        data: context.body,
        headers: context.headers,
        timeout: this.timeout
      });

      return {
        success: true,
        data: response.data as T
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const restError: RestError = {
          name: 'RestError',
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        };
        throw restError;
      }
      throw error;
    }
  }

  private normalizeError(error: unknown): RestError {
    if (error instanceof Error) {
      return {
        ...error,
        status: (error as any).status || 500,
        data: (error as any).data,
      };
    }
    return new Error('Unknown error occurred') as RestError;
  }
}