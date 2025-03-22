import { BaseError } from './base.error';
import { ServiceError } from './service.error';
import { ErrorHandler, ErrorMetadata, RecoveryStrategy } from './types';

/**
 * Error boundary configuration
 */
interface ErrorBoundaryConfig {
  handlers: ErrorHandler[];
  defaultRecoveryStrategy?: RecoveryStrategy;
  maxRetries?: number;
  retryDelay?: number;
  logErrors?: boolean;
}

/**
 * Creates an error boundary that handles errors with configured recovery strategies
 */
export class ErrorBoundary {
  private readonly handlers: ErrorHandler[];
  private readonly defaultRecoveryStrategy: RecoveryStrategy;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly logErrors: boolean;

  constructor(config: ErrorBoundaryConfig) {
    this.handlers = config.handlers;
    this.defaultRecoveryStrategy = config.defaultRecoveryStrategy ?? 'retry';
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.logErrors = config.logErrors ?? true;
  }

  /**
   * Wraps an async function with error handling
   */
  async handle<T>(
    operation: () => Promise<T>,
    metadata?: ErrorMetadata
  ): Promise<T> {
    let retryCount = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        const handledError = this.enrichError(error as Error, metadata);
        
        if (this.logErrors) {
          await this.notifyHandlers(handledError);
        }

        const strategy = this.determineRecoveryStrategy(handledError);
        
        switch (strategy) {
          case 'retry':
            if (retryCount < this.maxRetries) {
              retryCount++;
              await this.delay(this.retryDelay * retryCount);
              continue;
            }
            throw handledError;

          case 'circuit-breaker':
            // Implement circuit breaker logic here
            throw handledError;

          case 'fallback':
            // Implement fallback logic here
            throw handledError;

          case 'ignore':
            return undefined as T;

          default:
            throw handledError;
        }
      }
    }
  }

  /**
   * Enriches an error with additional context and metadata
   */
  private enrichError(error: Error, metadata?: ErrorMetadata): Error {
    if (error instanceof ServiceError) {
      return error.withMetadata(metadata ?? {});
    }

    if (error instanceof BaseError) {
      return error.withMetadata(metadata ?? {});
    }

    // Convert standard errors to BaseError
    return new BaseError(error.message, {
      cause: error,
      metadata
    });
  }

  /**
   * Determines the recovery strategy for an error
   */
  private determineRecoveryStrategy(error: Error): RecoveryStrategy {
    if (error instanceof ServiceError) {
      // Check if error is marked as retryable
      if (error.metadata?.retryable) {
        return 'retry';
      }
    }

    return this.defaultRecoveryStrategy;
  }

  /**
   * Notifies all error handlers
   */
  private async notifyHandlers(error: Error): Promise<void> {
    await Promise.all(
      this.handlers.map(handler => {
        try {
          return handler(error);
        } catch (handlerError) {
          console.error('Error handler failed:', handlerError);
          return Promise.resolve();
        }
      })
    );
  }

  /**
   * Delays execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Creates a new error boundary with the given configuration
 */
export function createErrorBoundary(config: ErrorBoundaryConfig): ErrorBoundary {
  return new ErrorBoundary(config);
}