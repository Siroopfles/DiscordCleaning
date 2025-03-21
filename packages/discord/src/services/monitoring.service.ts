import { Logger } from '../types';

interface MonitoringMetrics {
  currencyOperations: {
    total: number;
    success: number;
    failed: number;
    byType: {
      [key: string]: number;
    };
  };
  rateLimiting: {
    totalAttempts: number;
    blocked: number;
  };
}

export class MonitoringService {
  private metrics: MonitoringMetrics;
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
    this.metrics = {
      currencyOperations: {
        total: 0,
        success: 0,
        failed: 0,
        byType: {}
      },
      rateLimiting: {
        totalAttempts: 0,
        blocked: 0
      }
    };
  }

  trackCurrencyOperation(type: string, success: boolean) {
    const metrics = this.metrics.currencyOperations;
    
    metrics.total++;
    success ? metrics.success++ : metrics.failed++;
    
    if (!metrics.byType[type]) {
      metrics.byType[type] = 0;
    }
    metrics.byType[type]++;

    this.logger?.debug('Currency Operation Tracked', {
      type,
      success,
      metrics: this.metrics.currencyOperations
    });
  }

  trackRateLimitAttempt(blocked: boolean) {
    const metrics = this.metrics.rateLimiting;
    
    metrics.totalAttempts++;
    if (blocked) {
      metrics.blocked++;
    }

    this.logger?.debug('Rate Limit Attempt Tracked', {
      blocked,
      metrics: this.metrics.rateLimiting
    });
  }

  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      currencyOperations: {
        total: 0,
        success: 0,
        failed: 0,
        byType: {}
      },
      rateLimiting: {
        totalAttempts: 0,
        blocked: 0
      }
    };

    this.logger?.info('Metrics Reset');
  }

  logMetricsReport() {
    const { currencyOperations, rateLimiting } = this.metrics;
    
    this.logger?.info('Currency Operations Report', {
      total: currencyOperations.total,
      success: currencyOperations.success,
      failed: currencyOperations.failed,
      successRate: currencyOperations.total > 0 
        ? (currencyOperations.success / currencyOperations.total * 100).toFixed(2) + '%'
        : '0%',
      byType: currencyOperations.byType
    });

    this.logger?.info('Rate Limiting Report', {
      totalAttempts: rateLimiting.totalAttempts,
      blocked: rateLimiting.blocked,
      blockRate: rateLimiting.totalAttempts > 0
        ? (rateLimiting.blocked / rateLimiting.totalAttempts * 100).toFixed(2) + '%'
        : '0%'
    });
  }
}