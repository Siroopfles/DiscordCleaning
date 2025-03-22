import { INotificationProvider } from './provider.interface';
import { IProviderFactory, IProviderOptions } from './provider-factory.interface';
import { withPerformanceMonitoring } from './decorators/performance.decorator';
import { withRetry } from './decorators/retry.decorator';
import { NotificationError, NotificationErrorCode } from './errors/notification.error';
import { ProviderConfig, ProviderStatus } from './types/provider.types';

/**
 * Factory for creating and configuring notification providers
 * Implements provider registration, instantiation and decoration
 */
export class NotificationProviderFactory implements IProviderFactory {
  private providers: Map<string, new (config: ProviderConfig) => INotificationProvider>;
  private defaultConfigs: Map<string, ProviderConfig>;

  constructor() {
    this.providers = new Map();
    this.defaultConfigs = new Map();
  }

  /**
   * Register a provider implementation class
   */
  public registerProvider(
    type: string,
    providerClass: new (config: ProviderConfig) => INotificationProvider,
    defaultConfig?: ProviderConfig
  ): void {
    this.providers.set(type, providerClass);
    if (defaultConfig) {
      this.defaultConfigs.set(type, defaultConfig);
    }
  }

  /**
   * Create a new provider instance with applied decorators
   */
  public async createProvider(options: IProviderOptions): Promise<INotificationProvider> {
    const { config } = options;

    // Validate provider configuration
    await this.validateConfig(config);

    // Get provider implementation
    const ProviderClass = this.providers.get(config.name);
    if (!ProviderClass) {
      throw NotificationError.invalidConfig(
        config.id,
        `Provider type ${config.name} not registered`
      );
    }

    try {
      // Create base provider instance
      let provider = new ProviderClass(config);

      // Apply decorators in correct order:
      // 1. Retry (innermost) - Handles retries before performance monitoring
      // 2. Performance (outermost) - Monitors all operations including retries
      if (options.retryOptions) {
        provider = withRetry(provider, options.retryOptions);
      }
      
      if (options.performanceMonitoring !== false) {
        provider = withPerformanceMonitoring(provider, {
          slaThreshold: options.slaThreshold
        });
      }

      // Initialize if auth provided
      if (options.auth) {
        await provider.initialize(options.auth);
      }

      // Validate provider is operational
      const health = await provider.checkHealth();
      if (health.status === ProviderStatus.DOWN) {
        throw NotificationError.providerUnavailable(
          config.id,
          health.status,
          'Provider failed health check after initialization'
        );
      }

      return provider;

    } catch (error) {
      throw NotificationError.initializationFailed(
        config.id,
        `Failed to initialize provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  public supportsProvider(type: string): boolean {
    return this.providers.has(type);
  }

  public getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public getDefaultConfig(type: string): ProviderConfig {
    const config = this.defaultConfigs.get(type);
    if (!config) {
      throw NotificationError.invalidConfig(
        type,
        `No default configuration found for provider type ${type}`
      );
    }
    return { ...config }; // Return copy to prevent modification
  }

  public async validateConfig(config: ProviderConfig): Promise<boolean> {
    if (!config.id || !config.name) {
      throw NotificationError.invalidConfig(
        config.id || 'unknown',
        'Provider configuration must include id and name'
      );
    }

    const ProviderClass = this.providers.get(config.name);
    if (!ProviderClass) {
      throw NotificationError.invalidConfig(
        config.id,
        `Provider type ${config.name} not supported`
      );
    }

    // Validate supported channels
    if (!Array.isArray(config.supportedChannels) || config.supportedChannels.length === 0) {
      throw NotificationError.invalidConfig(
        config.id,
        'Provider must support at least one channel type'
      );
    }

    // Validate rate limits if specified
    if (config.rateLimits) {
      const { global, perChannel } = config.rateLimits;
      
      if (global) {
        if (global.maxPerSecond && global.maxPerSecond <= 0) {
          throw NotificationError.invalidConfig(
            config.id,
            'Global rate limit maxPerSecond must be positive'
          );
        }
        if (global.maxPerMinute && global.maxPerMinute <= 0) {
          throw NotificationError.invalidConfig(
            config.id,
            'Global rate limit maxPerMinute must be positive'
          );
        }
      }

      if (perChannel) {
        if (perChannel.maxPerSecond && perChannel.maxPerSecond <= 0) {
          throw NotificationError.invalidConfig(
            config.id,
            'Per-channel rate limit maxPerSecond must be positive'
          );
        }
        if (perChannel.maxPerMinute && perChannel.maxPerMinute <= 0) {
          throw NotificationError.invalidConfig(
            config.id,
            'Per-channel rate limit maxPerMinute must be positive'
          );
        }
      }
    }

    return true;
  }
}