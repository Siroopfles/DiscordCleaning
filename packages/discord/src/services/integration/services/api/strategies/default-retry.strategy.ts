import { RequestContext, RetryStrategy, RestError } from '../../../interfaces/api';

export class DefaultRetryStrategy implements RetryStrategy {
  private readonly maxRetries: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  shouldRetry(error: RestError, context: RequestContext): boolean {
    // Niet retry-en als we al het maximum aantal pogingen hebben bereikt
    if (context.retryCount >= this.maxRetries) {
      return false;
    }

    // Alleen retry-en op bepaalde HTTP status codes
    if (error.status) {
      // Retry bij server errors
      if (error.status >= 500) {
        return true;
      }

      // Retry bij rate limiting
      if (error.status === 429) {
        return true;
      }

      // Retry bij timeout of network errors
      if (error.status === 408) {
        return true;
      }
    }

    // Retry bij network errors (geen status code)
    if (!error.status && error.message?.toLowerCase().includes('network')) {
      return true;
    }

    // Retry bij timeout errors
    if (error.message?.toLowerCase().includes('timeout')) {
      return true;
    }

    return false;
  }

  getDelay(retryCount: number): number {
    // Exponential backoff met jitter
    const exponentialDelay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, retryCount)
    );

    // Voeg random jitter toe (±25% van de delay)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    
    return Math.max(0, Math.floor(exponentialDelay + jitter));
  }
}