import { ResponseContext, RestError, MetricsCollector } from '../../../interfaces/api';
import { BaseService } from '../../../../base.service';
import { DiscordClient } from '../../../../../types';

export class DefaultMetricsCollector extends BaseService implements MetricsCollector {
  private readonly metrics: {
    durations: number[];
    errors: Map<number, number>;
    cacheHits: number;
    cacheMisses: number;
  };

  constructor(client: DiscordClient) {
    super(client);
    this.metrics = {
      durations: [],
      errors: new Map(),
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  protected async initialize(): Promise<void> {
    this.log('debug', 'Initializing metrics collector');
  }

  recordDuration(context: ResponseContext): void {
    this.metrics.durations.push(context.duration);

    // Log performance metrics
    this.log('debug', 'API Request Duration', {
      path: context.request.path,
      method: context.request.method,
      duration: context.duration,
      cached: context.cached
    });

    // Bereken en log statistieken periodiek
    if (this.metrics.durations.length >= 100) {
      this.logStatistics();
    }
  }

  recordError(error: RestError, context: ResponseContext): void {
    const status = error.status || 500;
    const currentCount = this.metrics.errors.get(status) || 0;
    this.metrics.errors.set(status, currentCount + 1);

    this.log('error', 'API Error', {
      path: context.request.path,
      method: context.request.method,
      status,
      error: error.message,
      data: error.data
    });
  }

  recordCacheHit(context: ResponseContext): void {
    this.metrics.cacheHits++;
    
    this.log('debug', 'Cache Hit', {
      path: context.request.path,
      method: context.request.method
    });
  }

  recordCacheMiss(context: ResponseContext): void {
    this.metrics.cacheMisses++;
    
    this.log('debug', 'Cache Miss', {
      path: context.request.path,
      method: context.request.method
    });
  }

  private logStatistics(): void {
    const durations = this.metrics.durations;
    
    // Bereken statistieken
    const stats = {
      count: durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((sum, val) => sum + val, 0) / durations.length,
      p95: this.calculatePercentile(durations, 95),
      errors: Object.fromEntries(this.metrics.errors),
      cacheHitRate: this.calculateCacheHitRate()
    };

    // Log de statistieken
    this.log('info', 'API Performance Statistics', stats);

    // Reset metrics voor volgende periode
    this.metrics.durations = [];
    this.metrics.errors.clear();
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private calculateCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return this.metrics.cacheHits / total;
  }
}