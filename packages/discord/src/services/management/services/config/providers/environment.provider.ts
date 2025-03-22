import { AbstractConfigProvider } from '../abstract-config-provider';
import { ConfigProviderOptions, ConfigSourceType, ConfigValue } from '../../../interfaces/config';

/**
 * Environment variables configuration provider
 */
export class EnvironmentConfigProvider extends AbstractConfigProvider {
  private readonly prefix: string;
  private cachedKeys: string[];
  private readonly transformKey: (key: string) => string;

  constructor(
    options: ConfigProviderOptions & {
      /**
       * Optional prefix for environment variables
       * e.g., 'APP_' will only match variables starting with APP_
       */
      prefix?: string;
      /**
       * Optional key transformation function
       * e.g., convert APP_DB_HOST to db.host
       */
      transformKey?: (key: string) => string;
    }
  ) {
    super({
      ...options,
      type: ConfigSourceType.ENVIRONMENT
    });

    this.prefix = options.prefix || '';
    this.cachedKeys = [];
    this.transformKey = options.transformKey || this.defaultKeyTransform.bind(this);
  }

  /**
   * Initialize the provider
   */
  public async initialize(): Promise<void> {
    await this.refresh();
  }

  /**
   * Get a configuration value
   * @param key Configuration key
   */
  public async get<T>(key: string): Promise<ConfigValue<T> | undefined> {
    const envKey = this.getEnvKey(key);
    const value = process.env[envKey];

    if (value === undefined) {
      return undefined;
    }

    return {
      value: this.parseValue(value) as T,
      source: this.options.type,
      timestamp: Date.now()
    };
  }

  /**
   * Set a configuration value
   * @param key Configuration key
   * @param value Configuration value
   */
  public async set<T>(key: string, value: T): Promise<void> {
    const envKey = this.getEnvKey(key);
    process.env[envKey] = this.stringifyValue(value);

    // Update cached keys if new
    if (!this.cachedKeys.includes(envKey)) {
      this.cachedKeys.push(envKey);
    }
  }

  /**
   * Check if a configuration key exists
   * @param key Configuration key
   */
  public async has(key: string): Promise<boolean> {
    const envKey = this.getEnvKey(key);
    return envKey in process.env;
  }

  /**
   * Get all configuration keys
   */
  public async keys(): Promise<string[]> {
    return this.cachedKeys.map(envKey => this.transformKey(envKey.slice(this.prefix.length)));
  }

  /**
   * Refresh configuration values
   */
  public async refresh(): Promise<void> {
    // Cache all matching environment variables
    this.cachedKeys = Object.keys(process.env)
      .filter(key => key.startsWith(this.prefix));
  }

  /**
   * Start watching for environment changes
   * Note: Node.js doesn't provide direct env var change notifications
   * This is a no-op implementation
   */
  protected async startWatching(): Promise<void> {
    // No-op - environment variables can't be watched directly
  }

  /**
   * Stop watching for environment changes
   */
  protected async stopWatching(): Promise<void> {
    // No-op
  }

  /**
   * Clean up provider resources
   */
  protected async cleanup(): Promise<void> {
    // No cleanup needed
  }

  /**
   * Convert a configuration key to an environment variable name
   */
  private getEnvKey(key: string): string {
    return this.prefix + key.split('.').map(part => 
      part.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
    ).join('_');
  }

  /**
   * Default key transformation function
   * Converts environment variable names to configuration keys
   * e.g., APP_DB_HOST -> db.host
   */
  private defaultKeyTransform(envKey: string): string {
    return envKey
      .toLowerCase()
      .replace(/_./g, match => match[1].toUpperCase())
      .replace(/_/g, '.');
  }

  /**
   * Parse string value from environment variable
   */
  private parseValue(value: string): unknown {
    try {
      // Try parsing as JSON first
      return JSON.parse(value);
    } catch {
      // If not valid JSON, return as string
      return value;
    }
  }

  /**
   * Convert value to string for environment variable
   */
  private stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }
}