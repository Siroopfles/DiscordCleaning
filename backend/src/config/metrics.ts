import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import logger from '../utils/logger';

// Create a new Prometheus registry
export const register = new Registry();

// API Metrics
export const calendarApiDuration = new Histogram({
  name: 'calendar_api_duration_seconds',
  help: 'Duration of Google Calendar API calls',
  labelNames: ['operation'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 5],
  registers: [register]
});

export const calendarSyncDuration = new Histogram({
  name: 'calendar_sync_duration_seconds',
  help: 'Duration of calendar sync operations',
  labelNames: ['type'],
  buckets: [1, 3, 5, 7, 10, 15, 20],
  registers: [register]
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'calendar_cache_hits_total',
  help: 'Number of cache hits',
  labelNames: ['operation'],
  registers: [register]
});

export const cacheMisses = new Counter({
  name: 'calendar_cache_misses_total',
  help: 'Number of cache misses',
  labelNames: ['operation'],
  registers: [register]
});

// Rate Limiting Metrics
export const rateLimitRemaining = new Gauge({
  name: 'calendar_rate_limit_remaining',
  help: 'Remaining API quota for Google Calendar',
  registers: [register]
});

export const rateLimitResets = new Counter({
  name: 'calendar_rate_limit_resets_total',
  help: 'Number of times the rate limit has reset',
  registers: [register]
});

// Error Metrics
export const errorCounter = new Counter({
  name: 'calendar_errors_total',
  help: 'Number of errors encountered',
  labelNames: ['type'],
  registers: [register]
});

// Initialize metrics collection
export function initMetrics(): void {
  try {
    register.setDefaultLabels({
      app: 'boomerang-calendar'
    });
    
    logger.info('Prometheus metrics initialized');
  } catch (error) {
    logger.error('Failed to initialize metrics:', error);
  }
}