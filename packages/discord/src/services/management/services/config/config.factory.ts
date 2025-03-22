import { DiscordClient } from '../../../../types';
import { IConfigFactory, IConfigService } from '../../interfaces/config';
import { ConfigProviderOptions, ConfigSchema, ConfigSourceType } from '../../interfaces/config/types';
import { ConfigService } from './config.service';
import { JSONSchemaValidator } from './validators/json-schema.validator';

type FileProviderOptions = ConfigProviderOptions & {
  filePath: string;
};

/**
 * Factory implementation for creating ConfigService instances
 */
export class ConfigServiceFactory implements IConfigFactory {
  private implementations: Map<string, new (...args: any[]) => IConfigService>;
  private readonly defaultValidator: JSONSchemaValidator;

  constructor() {
    this.implementations = new Map();
    this.defaultValidator = new JSONSchemaValidator();
    
    // Register default implementation
    this.registerImplementation(ConfigService);
  }

  /**
   * Create a new ConfigService instance
   */
  public async createConfigService(
    client: DiscordClient,
    options: {
      providers?: ConfigProviderOptions[];
      validateOnStart?: boolean;
      refreshInterval?: number;
    } = {}
  ): Promise<IConfigService> {
    try {
      // Create service instance with default implementation
      const DefaultImpl = this.implementations.get('ConfigService');
      if (!DefaultImpl) {
        throw new Error('No default ConfigService implementation registered');
      }

      const service = new DefaultImpl(client, this.defaultValidator);

      // Register provided providers
      if (options.providers) {
        for (const providerOpts of options.providers) {
          await service.registerProvider(providerOpts);
        }
      }

      // Validate all configurations if requested
      if (options.validateOnStart) {
        const keys = await service.keys();
        for (const key of keys) {
          const value = await service.getRaw(key);
          if (value && value.source !== ConfigSourceType.MEMORY) {
            const schemaName = await this.getSchemaNameForValue(value.value);
            if (schemaName) {
              await service.validate(schemaName, value.value);
            }
          }
        }
      }

      // Setup refresh interval if specified
      if (options.refreshInterval && options.refreshInterval > 0) {
        setInterval(() => {
          service.refresh().catch(error => {
            client.emit('error', error);
          });
        }, options.refreshInterval);
      }

      return service;
    } catch (error) {
      throw new Error(`Failed to create ConfigService: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a config service with default providers
   */
  public async createDefaultConfigService(client: DiscordClient): Promise<IConfigService> {
    // Setup default providers
    const defaultProviders: (ConfigProviderOptions | FileProviderOptions)[] = [
      {
        name: 'environment',
        type: ConfigSourceType.ENVIRONMENT,
        priority: 100,
        refreshInterval: 60000, // 1 minute
      } as ConfigProviderOptions,
      {
        name: 'file',
        type: ConfigSourceType.FILE,
        priority: 50,
        filePath: '.env',
        refreshInterval: 30000, // 30 seconds
      } as FileProviderOptions,
      {
        name: 'memory',
        type: ConfigSourceType.MEMORY,
        priority: 0,
      } as ConfigProviderOptions
    ];

    return this.createConfigService(client, {
      providers: defaultProviders,
      validateOnStart: true,
      refreshInterval: 60000 // 1 minute
    });
  }

  /**
   * Register a custom config service implementation
   */
  public registerImplementation(implementation: new (...args: any[]) => IConfigService): void {
    const name = implementation.name;
    if (!name) {
      throw new Error('Implementation must have a name');
    }

    if (this.implementations.has(name)) {
      throw new Error(`Implementation ${name} is already registered`);
    }

    this.implementations.set(name, implementation);
  }

  /**
   * Get schema name from configuration value if available
   */
  private async getSchemaNameForValue(value: unknown): Promise<string | undefined> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ('$schema' in obj && typeof obj.$schema === 'string') {
        return obj.$schema;
      }
    }
    return undefined;
  }

  /**
   * Dispose of factory resources
   */
  public async dispose(): Promise<void> {
    await this.defaultValidator.dispose();
    this.implementations.clear();
  }
}