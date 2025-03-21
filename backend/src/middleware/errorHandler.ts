import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { webhookErrorCounter } from '../config/webhookMetrics';

// Custom error class for webhook errors
export class WebhookError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public type: string = 'WEBHOOK_ERROR',
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

// Webhook-specific error types
export const WebhookErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR'
} as const;

// Global error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with context
  const errorContext = {
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      type: err instanceof WebhookError ? err.type : 'UNKNOWN'
    },
    request: {
      method: req.method,
      url: req.url,
      correlationId: req.headers['x-correlation-id']
    }
  };

  // Increment webhook error counter if it's a webhook error
  if (err instanceof WebhookError) {
    webhookErrorCounter.inc({
      type: err.type,
      event: req.body?.eventType || 'unknown'
    });

    logger.error('Webhook error occurred', {
      ...errorContext,
      webhookId: req.body?.webhookId,
      eventType: req.body?.eventType,
      retryable: err.retryable
    });

    return res.status(err.statusCode).json({
      error: {
        type: err.type,
        message: err.message,
        retryable: err.retryable
      }
    });
  }

  // Handle other errors
  logger.error('Application error occurred', errorContext);

  // Don't expose internal errors to client in production
  const clientError = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(500).json({
    error: {
      message: clientError
    }
  });
};

// Helper functions for common webhook errors
export const createNetworkError = (message: string) => 
  new WebhookError(message, 503, WebhookErrorTypes.NETWORK, true);

export const createTimeoutError = (message: string) =>
  new WebhookError(message, 504, WebhookErrorTypes.TIMEOUT, true);

export const createValidationError = (message: string) =>
  new WebhookError(message, 400, WebhookErrorTypes.VALIDATION, false);

export const createConfigurationError = (message: string) =>
  new WebhookError(message, 500, WebhookErrorTypes.CONFIGURATION, false);

export const createAuthenticationError = (message: string) =>
  new WebhookError(message, 401, WebhookErrorTypes.AUTHENTICATION, false);

export const createRateLimitError = (message: string) =>
  new WebhookError(message, 429, WebhookErrorTypes.RATE_LIMIT, true);