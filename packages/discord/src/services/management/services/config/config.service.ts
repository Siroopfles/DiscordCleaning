import { DiscordClient } from '../../../../types';
import { ConfigProviderOptions, ConfigSourceType, IConfigProvider, IConfigValidator } from '../../interfaces/config';
import { AbstractConfigService } from './abstract-config.service';
import { FileConfigProvider } from './providers/file.provider';
import { EnvironmentConfigProvider } from './providers/environment.provider';
import { MemoryConfigProvider } from './providers/memory.provider';

interface MetricsService {
  registerCounter(options: {
    name: string;
    help: string;
    labelNames: string[];
  }): void;
  registerGauge(options: {
    name: string;
    help: string;
    labelNames: string[];
  }): void;
  registerHistogram(options: {
    name: string;
    help: string;
    labelNames: string[];
  }): void;
}

declare module '../../../../types' {
  interface DiscordServices {
    metrics?: MetricsService;
  }
}

/**
 * Default implementation of ConfigService
 */
export class ConfigService extends AbstractConfigService {
  constructor(client: DiscordClient, validator: IConfigValidator) {
    super(client, validator);
  }

  /**
   * Create a provider instance from options
   */
  protected async createProvider(options: ConfigProviderOptions): Promise<IConfigProvider> {
    switch (options.type) {
      case ConfigSourceType.FILE:
        if (!('filePath' in options)) {
          throw new Error('File provider requires filePath option');
        }
        return new FileConfigProvider({
          ...options,
          filePath: options.filePath as string
        });

      case ConfigSourceType.ENVIRONMENT:
        return new EnvironmentConfigProvider({
          ...options,
          prefix: (options as any).prefix
        });

      case ConfigSourceType.MEMORY:
        return new MemoryConfigProvider(options);

      default:
        throw new Error(`Unsupported provider type: ${options.type}`);
    }
  }

  /**
   * Initialize the service
   */
  protected async initialize(): Promise<void> {
    this.log('info', 'Initializing ConfigService');
    
    // Initialize metrics if available
    if (this.client.services.metrics) {
      this.initializeMetrics();
    }

    this.log('info', 'ConfigService initialized');
  }

  /**
   * Initialize metrics for monitoring
   */
  private initializeMetrics(): void {
    const metrics = this.client.services.metrics;
    if (!metrics) return;

    // Register config operation counters
    metrics.registerCounter({
      name: 'config_operations_total',
      help: 'Total number of configuration operations',
      labelNames: ['operation', 'provider', 'status']
    });

    // Register config value gauge
    metrics.registerGauge({
      name: 'config_values_total',
      help: 'Total number of configuration values',
      labelNames: ['provider']
    });

    // Register config refresh duration histogram
    metrics.registerHistogram({
      name: 'config_refresh_duration_seconds',
      help: 'Duration of configuration refresh operations',
      labelNames: ['provider']
    });
  }
}