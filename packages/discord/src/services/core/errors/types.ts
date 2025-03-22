/**
 * Common interface for error metadata
 */
export interface ErrorMetadata {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  service?: string;
  operation?: string;
  requestId?: string;
  retryable?: boolean;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  [key: string]: unknown;
}

/**
 * Error options with optional metadata
 */
export type ErrorOptions = {
  cause?: Error;
  metadata?: ErrorMetadata;
};

/**
 * Error boundary handler function type
 */
export type ErrorHandler = (error: Error) => Promise<void> | void;

/**
 * Error recovery strategy type
 */
export type RecoveryStrategy = 'retry' | 'fallback' | 'circuit-breaker' | 'ignore';

/**
 * Error context for service operations
 */
export interface ErrorContext {
  service: string;
  operation: string;
  timestamp: Date;
  metadata?: ErrorMetadata;
}