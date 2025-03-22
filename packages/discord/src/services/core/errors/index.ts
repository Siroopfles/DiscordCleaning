/**
 * Error Handling Framework
 * 
 * Provides a comprehensive type-safe error handling system with:
 * - Hierarchical error classes
 * - Error boundaries with recovery strategies
 * - Service-level error context
 * - Metadata support
 * - Integration with logging system
 * 
 * @example
 * ```typescript
 * // Create an error boundary
 * const boundary = createErrorBoundary({
 *   handlers: [logError],
 *   maxRetries: 3
 * });
 * 
 * // Use the boundary to handle errors
 * await boundary.handle(async () => {
 *   // Your code here
 * }, {
 *   service: 'UserService',
 *   operation: 'createUser'
 * });
 * 
 * // Create service-specific errors
 * throw createServiceError('User not found', {
 *   service: 'UserService',
 *   operation: 'getUser'
 * });
 * ```
 */

export * from './types';
export * from './base.error';
export * from './service.error';
export * from './boundary';

// Re-export commonly used functions
export { createErrorBoundary } from './boundary';
export { createServiceError } from './service.error';