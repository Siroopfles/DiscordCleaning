import { BaseError } from './base.error';
import { ErrorContext, ErrorMetadata, ErrorOptions } from './types';

/**
 * Service-specific error class with context
 * Extends BaseError with service-related metadata
 */
export class ServiceError extends BaseError {
  readonly name: string = 'ServiceError';
  readonly context: ErrorContext;

  constructor(
    message: string,
    context: Omit<ErrorContext, 'timestamp'>,
    options?: ErrorOptions
  ) {
    const metadata: ErrorMetadata = {
      ...options?.metadata,
      service: context.service,
      operation: context.operation
    };

    super(message, { ...options, metadata });

    this.context = {
      ...context,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }

  /**
   * Creates a recoverable variant of the error
   */
  asRecoverable(retryable = true): ServiceError {
    return new ServiceError(this.message, this.context, {
      cause: this.cause,
      metadata: {
        ...this.metadata,
        retryable
      }
    });
  }

  /**
   * Creates a new instance with additional context
   */
  withContext(additionalContext: Partial<ErrorContext>): ServiceError {
    return new ServiceError(this.message, {
      ...this.context,
      ...additionalContext
    }, {
      cause: this.cause,
      metadata: this.metadata
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      context: {
        service: this.context.service,
        operation: this.context.operation,
        timestamp: this.context.timestamp.toISOString(),
        metadata: this.context.metadata
      }
    };
  }
}

/**
 * Creates a ServiceError with the given message and context
 */
export function createServiceError(
  message: string,
  context: Omit<ErrorContext, 'timestamp'>,
  options?: ErrorOptions
): ServiceError {
  return new ServiceError(message, context, options);
}