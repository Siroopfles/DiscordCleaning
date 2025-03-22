import { ErrorMetadata } from './types';

/**
 * Base error class for all service errors
 * Supports metadata and maintains full stack traces
 */
export class BaseError extends Error {
  readonly name: string = 'BaseError';
  readonly timestamp: Date;
  readonly metadata?: ErrorMetadata;
  readonly cause?: Error;

  constructor(message: string, options?: { cause?: Error; metadata?: ErrorMetadata }) {
    super(message);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.timestamp = new Date();
    this.metadata = options?.metadata;
    this.cause = options?.cause;

    // Capture stack trace with proper prototypal inheritance
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Formats the error for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      stack: this.stack,
      cause: this.cause instanceof Error ? 
        (this.cause as BaseError).toJSON?.() ?? this.cause.message :
        this.cause
    };
  }

  /**
   * Creates an enriched error with additional metadata
   */
  withMetadata(metadata: ErrorMetadata): BaseError {
    return new BaseError(this.message, {
      cause: this.cause,
      metadata: {
        ...this.metadata,
        ...metadata
      }
    });
  }
}