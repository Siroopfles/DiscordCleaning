import { ConfigProviderOptions, ConfigSchema, ConfigValue } from '../../interfaces/config/types';
import { IConfigProvider } from '../../interfaces/config/config-provider.interface';

/**
 * Abstract base class for configuration providers
 * Implements common functionality while allowing specific source implementations
 */
export abstract class AbstractConfigProvider implements IConfigProvider {
  protected readonly _changeListeners: Set<(key: string, value: ConfigValue) => void>;
  protected readonly _values: Map<string, ConfigValue>;

  constructor(
    protected readonly _options: ConfigProviderOptions
  ) {
    this._changeListeners = new Set();
    this._values = new Map();
  }

  public get options(): ConfigProviderOptions {
    return this._options;
  }

  public get schema(): ConfigSchema | undefined {
    return this._options.schema;
  }

  public async initialize(): Promise<void> {
    await this.loadValues();
    
    if (this._options.refreshInterval) {
      this.startRefreshInterval();
    }
  }

  public async get<T>(key: string): Promise<ConfigValue<T> | undefined> {
    const value = this._values.get(key) as ConfigValue<T> | undefined;
    if (!value) {
      const loaded = await this.loadValue<T>(key);
      if (loaded) {
        this._values.set(key, loaded);
        return loaded;
      }
    }
    return value;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    const configValue: ConfigValue<T> = {
      value,
      source: this._options.type,
      timestamp: Date.now(),
      isSecret: false // Can be overridden by specific implementations
    };

    await this.saveValue(key, configValue);
    this._values.set(key, configValue);
    this.notifyChange(key, configValue);
  }

  public async has(key: string): Promise<boolean> {
    if (this._values.has(key)) {
      return true;
    }
    return this.checkExists(key);
  }

  public async keys(): Promise<string[]> {
    const loadedKeys = await this.loadKeys();
    const cachedKeys = Array.from(this._values.keys());
    return Array.from(new Set([...loadedKeys, ...cachedKeys]));
  }

  public async watch(onChange: (key: string, value: ConfigValue) => void): Promise<void> {
    this._changeListeners.add(onChange);
  }

  public async unwatch(): Promise<void> {
    this._changeListeners.clear();
  }

  public async refresh(): Promise<void> {
    await this.loadValues();
  }

  public async dispose(): Promise<void> {
    this._changeListeners.clear();
    this._values.clear();
    this.stopRefreshInterval();
  }

  /**
   * Load all configuration values from the source
   * Must be implemented by specific provider implementations
   */
  protected abstract loadValues(): Promise<void>;

  /**
   * Load a specific configuration value from the source
   * Must be implemented by specific provider implementations
   */
  protected abstract loadValue<T>(key: string): Promise<ConfigValue<T> | undefined>;

  /**
   * Save a configuration value to the source
   * Must be implemented by specific provider implementations
   */
  protected abstract saveValue<T>(key: string, value: ConfigValue<T>): Promise<void>;

  /**
   * Check if a configuration key exists in the source
   * Must be implemented by specific provider implementations
   */
  protected abstract checkExists(key: string): Promise<boolean>;

  /**
   * Load all configuration keys from the source
   * Must be implemented by specific provider implementations
   */
  protected abstract loadKeys(): Promise<string[]>;

  /**
   * Notify change listeners of a configuration change
   */
  protected notifyChange(key: string, value: ConfigValue): void {
    for (const listener of this._changeListeners) {
      try {
        listener(key, value);
      } catch (error) {
        console.error(`Error in config change listener: ${error}`);
      }
    }
  }

  private refreshInterval?: NodeJS.Timeout;

  /**
   * Start the refresh interval if configured
   */
  private startRefreshInterval(): void {
    if (this._options.refreshInterval && !this.refreshInterval) {
      this.refreshInterval = setInterval(
        () => this.refresh(),
        this._options.refreshInterval
      );
    }
  }

  /**
   * Stop the refresh interval if running
   */
  private stopRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }
}