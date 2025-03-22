import { INotificationProvider } from './provider.interface';
import { ProviderConfig, ProviderAuth } from './types/provider.types';

export interface IProviderOptions {
  config: ProviderConfig;
  auth?: ProviderAuth;
  performanceMonitoring?: boolean;
  retryOptions?: {
    maxAttempts: number;
    backoffFactor: number;
    initialDelay: number;
  };
  slaThreshold?: number; // milliseconds
}

export interface IProviderFactory {
  /**
   * Create a new notification provider instance
   */
  createProvider(options: IProviderOptions): Promise<INotificationProvider>;

  /**
   * Check if a provider type is supported
   */
  supportsProvider(type: string): boolean;

  /**
   * Get a list of supported provider types
   */
  getSupportedProviders(): string[];

  /**
   * Get default configuration for a provider type
   */
  getDefaultConfig(type: string): ProviderConfig;

  /**
   * Validate provider configuration
   */
  validateConfig(config: ProviderConfig): Promise<boolean>;
}