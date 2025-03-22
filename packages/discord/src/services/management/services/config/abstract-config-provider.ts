import { ConfigProviderOptions, ConfigSchema, ConfigValue, IConfigProvider } from '../../interfaces/config';

/**
 * Abstract base class for configuration providers
 */
export abstract class AbstractConfigProvider implements IConfigProvider {
  protected changeListeners: Set<(key: string, value: ConfigValue) => void>;

  constructor(
    protected readonly _options: ConfigProviderOptions,
  ) {
    this.changeListeners = new Set();
  }

  /**
   * Get provider options
   */
  public get options(): ConfigProviderOptions {
    return this._options;
  }

  /**
   * Get configuration schema if available
   */
  public get schema(): ConfigSchema | undefined {
    return this._options.schema;
  }

  /**
   * Initialize the provider
   */
  public abstract initialize(): Promise<void>;

  /**
   * Get a configuration value
   * @param key Configuration key
   */
  public abstract get<T>(key: string): Promise<ConfigValue<T> | undefined>;

  /**
   * Set a configuration value
   * @param key Configuration key
   * @param value Configuration value
   */
  public abstract set<T>(key: string, value: T): Promise<void>;

  /**
   * Check if a configuration key exists
   * @param key Configuration key
   */
  public abstract has(key: string): Promise<boolean>;

  /**
   * Get all configuration keys
   */
  public abstract keys(): Promise<string[]>;

  /**
   * Refresh configuration values from source
   */
  public abstract refresh(): Promise<void>;

  /**
   * Start watching for configuration changes
   * @param onChange Callback for configuration changes
   */
  public async watch(onChange: (key: string, value: ConfigValue) => void): Promise<void> {
    this.changeListeners.add(onChange);
    await this.startWatching();
  }

  /**
   * Stop watching for configuration changes
   */
  public async unwatch(): Promise<void> {
    this.changeListeners.clear();
    await this.stopWatching();
  }

  /**
   * Clean up provider resources
   */
  public async dispose(): Promise<void> {
    await this.unwatch();
    await this.cleanup();
  }

  /**
   * Notify listeners of configuration changes
   * @param key Changed configuration key
   * @param value New configuration value
   */
  protected notifyChange(key: string, value: ConfigValue): void {
    for (const listener of this.changeListeners) {
      try {
        listener(key, value);
      } catch (error) {
        console.error('Error in configuration change listener:', error);
      }
    }
  }

  /**
   * Start watching for configuration changes
   * Implement in concrete providers if supported
   */
  protected async startWatching(): Promise<void> {
    // Default no-op implementation
  }

  /**
   * Stop watching for configuration changes
   * Implement in concrete providers if supported
   */
  protected async stopWatching(): Promise<void> {
    // Default no-op implementation
  }

  /**
   * Clean up provider-specific resources
   * Implement in concrete providers if needed
   */
  protected async cleanup(): Promise<void> {
    // Default no-op implementation
  }
}