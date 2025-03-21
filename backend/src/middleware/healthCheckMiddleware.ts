import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import logger from '../utils/logger';
import { register } from '../config/metrics';

interface HealthStatus {
  status: 'up' | 'down';
  redis: 'connected' | 'disconnected';
  calendar_api: 'operational' | 'error';
  webhook_system: 'operational' | 'error';
  metrics: 'collecting' | 'error';
  details?: {
    redis_error?: string;
    calendar_error?: string;
    webhook_error?: string;
    metrics_error?: string;
  };
}

export class HealthCheck {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  private async checkRedis(): Promise<{ status: 'connected' | 'disconnected'; error?: string }> {
    try {
      await this.redis.ping();
      return { status: 'connected' };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { 
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkMetrics(): Promise<{ status: 'collecting' | 'error'; error?: string }> {
    try {
      await register.metrics();
      return { status: 'collecting' };
    } catch (error) {
      logger.error('Metrics collection failed:', error);
      return { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkWebhookSystem(): Promise<{ status: 'operational' | 'error'; error?: string }> {
    try {
      // Check webhook metrics for errors in the last minute
      const metrics = await register.metrics();
      const webhookErrors = metrics.match(/webhook_errors_total{[^}]*} \d+/g);
      const queueSizeMatch = metrics.match(/webhook_queue_size{status="failed"}.*?(\d+)/);
      const failedQueueSize = queueSizeMatch ? parseInt(queueSizeMatch[1]) : 0;

      if ((webhookErrors && webhookErrors.length > 0) || failedQueueSize > 0) {
        return {
          status: 'error',
          error: `Webhook issues detected: ${webhookErrors?.length || 0} errors, ${failedQueueSize} failed deliveries in queue`
        };
      }

      return { status: 'operational' };
    } catch (error) {
      logger.error('Webhook system health check failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async check(req: Request, res: Response): Promise<void> {
    const status: HealthStatus = {
      status: 'up',
      redis: 'connected',
      calendar_api: 'operational',
      webhook_system: 'operational',
      metrics: 'collecting',
      details: {}
    };

    // Check Redis
    const redisHealth = await this.checkRedis();
    status.redis = redisHealth.status;
    if (redisHealth.error) {
      status.details!.redis_error = redisHealth.error;
      status.status = 'down';
    }

    // Check metrics
    const metricsHealth = await this.checkMetrics();
    status.metrics = metricsHealth.status;
    if (metricsHealth.error) {
      status.details!.metrics_error = metricsHealth.error;
      status.status = 'down';
    }

    // Check if we have any errors in the last minute from our metrics
    try {
      const metrics = await register.metrics();
      const errorMetrics = metrics.match(/calendar_errors_total{[^}]*} \d+/g);
      if (errorMetrics && errorMetrics.length > 0) {
        status.calendar_api = 'error';
        status.status = 'down';
        status.details!.calendar_error = 'Recent errors detected in calendar API';
      }
    } catch (error) {
      logger.error('Error checking calendar metrics:', error);
      status.calendar_api = 'error';
      status.status = 'down';
      status.details!.calendar_error = 'Failed to check calendar metrics';
    }

    // Check webhook system
    const webhookHealth = await this.checkWebhookSystem();
    status.webhook_system = webhookHealth.status;
    if (webhookHealth.error) {
      status.details!.webhook_error = webhookHealth.error;
      status.status = 'down';
    }

    const statusCode = status.status === 'up' ? 200 : 503;
    res.status(statusCode).json(status);

    // Log health check results
    logger.info('Health check completed', { 
      status,
      statusCode,
      requestId: req.headers['x-request-id']
    });
  }
}

// Export factory function for creating health check middleware
export const createHealthCheckMiddleware = (redis: Redis) => {
  const healthCheck = new HealthCheck(redis);
  return (req: Request, res: Response) => healthCheck.check(req, res);
};