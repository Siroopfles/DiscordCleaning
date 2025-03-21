import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { register } from './metrics';
import logger from '../utils/logger';

// Counter for webhook deliveries by status
export const webhookDeliveryCounter = new Counter({
  name: 'webhook_delivery_total',
  help: 'Total number of webhook deliveries',
  labelNames: ['status', 'event'] as const,
  registers: [register]
});

// Histogram for webhook delivery duration
export const webhookDeliveryDuration = new Histogram({
  name: 'webhook_delivery_duration_seconds',
  help: 'Webhook delivery duration in seconds',
  labelNames: ['status', 'event_type'] as const,
  buckets: [0.1, 0.5, 1, 2, 5],  // 100ms to 5s
  registers: [register]
});

// Counter for webhook errors
export const webhookErrorCounter = new Counter({
  name: 'webhook_errors_total',
  help: 'Total number of webhook errors',
  labelNames: ['type', 'event'] as const,  // type: network, timeout, etc
  registers: [register]
});

// Counter for webhook retries
export const webhookRetryCounter = new Counter({
  name: 'webhook_retry_total',
  help: 'Total number of webhook delivery retries',
  labelNames: ['event_type'] as const,
  registers: [register]
});

// Gauge for webhook queue size
export const webhookQueueSize = new Gauge({
  name: 'webhook_queue_size',
  help: 'Current size of webhook delivery queue',
  labelNames: ['status'] as const,  // pending, processing, failed
  registers: [register]
});

// Initialize webhook metrics
export function initWebhookMetrics(): void {
  try {
    register.setDefaultLabels({
      app: 'boomerang-webhooks'
    });
    logger.info('Webhook metrics initialized');
  } catch (error) {
    logger.error('Failed to initialize webhook metrics:', error);
  }
}