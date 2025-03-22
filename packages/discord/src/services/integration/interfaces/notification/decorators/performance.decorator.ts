import { INotificationProvider } from '../provider.interface';
import { NotificationError } from '../errors/notification.error';
import { IMessage } from '../message.interface';
import { ProviderMetrics, ProviderStatus } from '../types/provider.types';

const DEFAULT_SLA_THRESHOLD = 5000; // 5 seconds

/**
 * Extract channelId from message, falling back to metadata
 */
function getMessageChannelId(message: IMessage): string {
  const options = message.getOptions();
  return options.channelId || 
    (message.getMetadata()?.channelId as string) || 
    'unknown';
}

type MethodNames = keyof INotificationProvider;

/**
 * Performance monitoring decorator for notification providers
 * Tracks timing, success rates, and enforces SLA thresholds
 */
export function withPerformanceMonitoring(
  provider: INotificationProvider,
  options: {
    slaThreshold?: number;
    enableMetrics?: boolean;
  } = {}
): INotificationProvider {
  const slaThreshold = options.slaThreshold ?? DEFAULT_SLA_THRESHOLD;
  const metrics: ProviderMetrics = {
    uptime: 0,
    totalMessagesSent: 0,
    totalMessagesDelivered: 0,
    totalMessagesFailed: 0,
    averageDeliveryTime: 0,
    channelMetrics: {}
  };

  let totalDeliveryTime = 0;
  const startTime = Date.now();

  // Create proxy to intercept provider methods
  return new Proxy(provider, {
    get(target: INotificationProvider, prop: string | symbol): unknown {
      const method = Reflect.get(target, prop);

      // Handle special methods with performance monitoring
      switch (prop as MethodNames) {
        case 'send':
          return async function(this: INotificationProvider, message: IMessage): Promise<void> {
            const start = Date.now();
            metrics.totalMessagesSent++;

            try {
              await (method as Function).apply(this, [message]);
              
              const deliveryTime = Date.now() - start;
              totalDeliveryTime += deliveryTime;
              metrics.totalMessagesDelivered++;
              metrics.averageDeliveryTime = totalDeliveryTime / metrics.totalMessagesDelivered;

              // Check SLA threshold
              if (deliveryTime > slaThreshold) {
                throw NotificationError.slaThresholdExceeded(
                  this.getConfig().id,
                  getMessageChannelId(message),
                  message.getId(),
                  slaThreshold,
                  deliveryTime
                );
              }

            } catch (error) {
              metrics.totalMessagesFailed++;
              throw error;
            }
          };

        case 'getMetrics':
          return async function(this: INotificationProvider): Promise<ProviderMetrics> {
            const baseMetrics = await (method as Function).apply(this);
            
            if (!baseMetrics) {
              return {
                ...metrics,
                uptime: Math.floor((Date.now() - startTime) / 1000)
              };
            }

            return {
              ...baseMetrics as ProviderMetrics,
              ...metrics,
              uptime: Math.floor((Date.now() - startTime) / 1000),
              // Merge channel metrics
              channelMetrics: {
                ...(baseMetrics as ProviderMetrics).channelMetrics,
                ...metrics.channelMetrics
              }
            };
          };

        case 'checkHealth':
          return async function(this: INotificationProvider): Promise<{
            status: ProviderStatus;
            channels: Record<string, ProviderStatus>;
          }> {
            const healthCheck = await (method as Function).apply(this);
            
            if (!healthCheck) {
              return {
                status: ProviderStatus.DEGRADED,
                channels: {}
              };
            }

            // Degrade status if error rate is too high
            if (metrics.totalMessagesSent > 0) {
              const errorRate = metrics.totalMessagesFailed / metrics.totalMessagesSent;
              if (errorRate > 0.1) { // 10% error rate threshold
                healthCheck.status = ProviderStatus.DEGRADED;
              }
            }

            return healthCheck;
          };

        default:
          return typeof method === 'function'
            ? method.bind(target)
            : method;
      }
    }
  });
}