import { ConfigProviderOptions, ConfigSchema, ConfigValue } from './types';

/**
 * Interface for configuration providers
 * Supports multiple configuration sources with type-safe access
 */
export interface IConfigProvider {
  /**
   * Get provider options
   */
  readonly options: ConfigProviderOptions;

  /**
   * Get configuration schema if available
   */
  readonly schema?: ConfigSchema;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Get a configuration value
   * @param key Configuration key
   * @returns Configuration value with metadata
   */
  get<T>(key: string): Promise<ConfigValue<T> | undefined>;

  /**
   * Set a configuration value
   * @param key Configuration key
   * @param value Configuration value
   */
  set<T>(key: string, value: T): Promise<void>;

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
   * Start watching for configuration changes
   * @param onChange Callback for configuration changes
   */
  watch(onChange: (key: string, value: ConfigValue) => void): Promise<void>;

  /**
   * Stop watching for configuration changes
   */
  unwatch(): Promise<void>;

  /**
   * Refresh configuration values from source
   */
  refresh(): Promise<void>;

  /**
   * Clean up provider resources
   */
  dispose(): Promise<void>;
}