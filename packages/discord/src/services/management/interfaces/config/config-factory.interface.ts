import { DiscordClient } from '../../../../types';
import { IConfigService } from './config-service.interface';
import { ConfigProviderOptions } from './types';

/**
 * Factory interface for creating ConfigService instances
 */
export interface IConfigFactory {
  /**
   * Create a new ConfigService instance
   * @param client DiscordClient instance
   * @param options Initial configuration options
   */
  createConfigService(
    client: DiscordClient,
    options?: {
      providers?: ConfigProviderOptions[];
      validateOnStart?: boolean;
      refreshInterval?: number;
    }
  ): Promise<IConfigService>;

  /**
   * Create a config service with default providers
   * @param client DiscordClient instance
   */
  createDefaultConfigService(client: DiscordClient): Promise<IConfigService>;

  /**
   * Register a custom config service implementation
   * @param implementation Custom ConfigService implementation
   */
  registerImplementation(implementation: new (...args: any[]) => IConfigService): void;
}

/**
 * Constructor type for ConfigFactory implementations
 */
export interface ConfigFactoryConstructor {
  new(): IConfigFactory;
}