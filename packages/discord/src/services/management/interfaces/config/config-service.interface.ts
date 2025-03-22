import { BaseService } from '../../../base.service';
import { ConfigChangeEvent, ConfigProviderOptions, ConfigSchema, ConfigValue, ValidationResult } from './types';
import { IConfigProvider } from './config-provider.interface';
import { IConfigValidator } from './config-validator.interface';

/**
 * Interface for the Config Management Service
 * Extends BaseService for lifecycle management and logging
 */
export interface IConfigService extends BaseService {
  /**
   * Get the config validator instance
   */
  readonly validator: IConfigValidator;

  /**
   * Get registered config providers
   */
  readonly providers: Map<string, IConfigProvider>;

  /**
   * Register a new configuration provider
   * @param options Provider options
   */
  registerProvider(options: ConfigProviderOptions): Promise<void>;

  /**
   * Remove a configuration provider
   * @param name Provider name
   */
  removeProvider(name: string): Promise<void>;

  /**
   * Get a configuration value with type safety
   * @param key Configuration key
   * @param defaultValue Optional default value
   */
  get<T>(key: string, defaultValue?: T): Promise<T | undefined>;

  /**
   * Set a configuration value
   * @param key Configuration key
   * @param value Configuration value
   * @param options Optional provider-specific options
   */
  set<T>(key: string, value: T, options?: { provider?: string; isSecret?: boolean }): Promise<void>;

  /**
   * Get raw configuration value with metadata
   * @param key Configuration key
   */
  getRaw<T>(key: string): Promise<ConfigValue<T> | undefined>;

  /**
   * Check if a configuration key exists
   * @param key Configuration key
   */
  has(key: string): Promise<boolean>;

  /**
   * Get all configuration keys
   */
  keys(): Promise<string[]>;

  /**
   * Register a schema for configuration validation
   * @param name Schema name
   * @param schema JSON Schema definition
   */
  registerSchema(name: string, schema: ConfigSchema): Promise<void>;

  /**
   * Validate configuration value against schema
   * @param schemaName Schema name
   * @param value Value to validate
   */
  validate(schemaName: string, value: unknown): Promise<ValidationResult>;

  /**
   * Subscribe to configuration changes
   * @param callback Callback function for change events
   */
  subscribe(callback: (event: ConfigChangeEvent) => void): void;

  /**
   * Unsubscribe from configuration changes
   * @param callback Previously registered callback function
   */
  unsubscribe(callback: (event: ConfigChangeEvent) => void): void;

  /**
   * Refresh all configuration values from providers
   */
  refresh(): Promise<void>;

  /**
   * Get all configuration values as a snapshot
   */
  snapshot(): Promise<Record<string, ConfigValue>>;
}

/**
 * Constructor type for ConfigService implementations
 */
export interface ConfigServiceConstructor {
  new (...args: any[]): IConfigService;
}