import { INotificationProvider } from '../provider.interface';
import { IMessage } from '../message.interface';
import { NotificationError, NotificationErrorCode } from '../errors/notification.error';
import { MessageStatus } from '../types/message.types';

const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 3,
  backoffFactor: 2,
  initialDelay: 1000, // 1 second
  maxDelay: 10000 // 10 seconds
};

type RetryOptions = {
  maxAttempts: number;
  backoffFactor: number;
  initialDelay: number;
  maxDelay?: number;
};

/**
 * Determines if an error should trigger a retry attempt
 */
function isRetryableError(error: Error): boolean {
  if (error instanceof NotificationError) {
    switch (error.code) {
      case NotificationErrorCode.MESSAGE_SEND_FAILED:
      case NotificationErrorCode.PROVIDER_UNAVAILABLE:
        return true;
      case NotificationErrorCode.PROVIDER_AUTH_FAILED:
      case NotificationErrorCode.TEMPLATE_VALIDATION_FAILED:
      case NotificationErrorCode.INVALID_CONFIG:
        return false;
      default:
        return false;
    }
  }
  // Network or transient errors should be retried
  return error.message.toLowerCase().includes('timeout') ||
         error.message.toLowerCase().includes('network') ||
         error.message.toLowerCase().includes('connection');
}

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
function calculateBackoffDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt);
  return options.maxDelay ? Math.min(delay, options.maxDelay) : delay;
}

/**
 * Sleep for specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry decorator for notification providers
 * Implements exponential backoff retry strategy
 */
export function withRetry(
  provider: INotificationProvider,
  options: Partial<RetryOptions> = {}
): INotificationProvider {
  const retryOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };

  return new Proxy(provider, {
    get(target: INotificationProvider, prop: string | symbol): unknown {
      const method = Reflect.get(target, prop);

      if (prop === 'send') {
        return async function(this: INotificationProvider, message: IMessage): Promise<void> {
          let lastError: Error | undefined;
          
          for (let attempt = 0; attempt < retryOptions.maxAttempts; attempt++) {
            try {
              // Update message status if supported
              if (message.getDeliveryInfo) {
                const deliveryInfo = message.getDeliveryInfo();
                deliveryInfo.status = attempt > 0 ? MessageStatus.RETRYING : MessageStatus.PENDING;
                deliveryInfo.attemptCount = attempt + 1;
              }

              await (method as Function).apply(this, [message]);
              return; // Success
              
            } catch (error) {
              lastError = error as Error;
              
              // Only retry if error is retryable and we haven't exceeded max attempts
              if (!isRetryableError(lastError) || attempt === retryOptions.maxAttempts - 1) {
                throw NotificationError.messageSendFailed(
                  this.getConfig().id,
                  message.getOptions().channelId || 'unknown',
                  message.getId(),
                  `Failed after ${attempt + 1} attempts: ${lastError.message}`,
                  attempt + 1,
                  lastError
                );
              }

              // Wait before next retry using exponential backoff
              const delay = calculateBackoffDelay(attempt, retryOptions);
              await sleep(delay);
            }
          }

          // Should never reach here due to throw in catch block
          throw lastError;
        };
      }

      return typeof method === 'function'
        ? method.bind(target)
        : method;
    }
  });
}