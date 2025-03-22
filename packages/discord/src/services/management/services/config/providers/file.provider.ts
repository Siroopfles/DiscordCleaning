import * as fs from 'fs/promises';
import * as path from 'path';
import * as chokidar from 'chokidar';
import * as yaml from 'js-yaml';
import { AbstractConfigProvider } from '../abstract-config-provider';
import { ConfigProviderOptions, ConfigSourceType, ConfigValue } from '../../../interfaces/config';

type ConfigData = Record<string, unknown>;

/**
 * File-based configuration provider supporting JSON and YAML formats
 */
export class FileConfigProvider extends AbstractConfigProvider {
  private data: ConfigData;
  private watcher?: chokidar.FSWatcher;
  private readonly filePath: string;
  private readonly fileFormat: 'json' | 'yaml';

  constructor(
    options: ConfigProviderOptions & { filePath: string }
  ) {
    super({
      ...options,
      type: ConfigSourceType.FILE
    });

    this.data = {};
    this.filePath = path.resolve(options.filePath);
    this.fileFormat = this.determineFormat(this.filePath);
  }

  /**
   * Initialize the provider
   */
  public async initialize(): Promise<void> {
    await this.loadFile();
  }

  /**
   * Get a configuration value
   * @param key Configuration key
   */
  public async get<T>(key: string): Promise<ConfigValue<T> | undefined> {
    const value = this.getNestedValue(this.data, key) as T;
    if (value === undefined) {
      return undefined;
    }

    return {
      value,
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
    this.setNestedValue(this.data, key, value);
    await this.saveFile();
  }

  /**
   * Check if a configuration key exists
   * @param key Configuration key
   */
  public async has(key: string): Promise<boolean> {
    return this.getNestedValue(this.data, key) !== undefined;
  }

  /**
   * Get all configuration keys
   */
  public async keys(): Promise<string[]> {
    return this.getAllKeys(this.data);
  }

  /**
   * Refresh configuration values from file
   */
  public async refresh(): Promise<void> {
    await this.loadFile();
  }

  /**
   * Start watching for file changes
   */
  protected async startWatching(): Promise<void> {
    try {
      this.watcher = chokidar.watch(this.filePath, {
        persistent: true,
        ignoreInitial: true
      });

      this.watcher.on('change', async () => {
        await this.loadFile();
      });
    } catch (error) {
      await this.stopWatching();
      throw new Error(`Failed to watch config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stop watching for file changes
   */
  protected async stopWatching(): Promise<void> {
    await this.watcher?.close();
    this.watcher = undefined;
  }

  /**
   * Clean up provider resources
   */
  protected async cleanup(): Promise<void> {
    await this.stopWatching();
  }

  /**
   * Load configuration from file
   */
  private async loadFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const oldData = { ...this.data };
      this.data = this.parseConfig(content);

      // Notify changes
      const changedKeys = this.findChangedKeys(oldData, this.data);
      for (const key of changedKeys) {
        const value = await this.get(key);
        if (value) {
          this.notifyChange(key, value);
        }
      }
    } catch (error) {
      throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save configuration to file
   */
  private async saveFile(): Promise<void> {
    try {
      const content = this.fileFormat === 'json'
        ? JSON.stringify(this.data, null, 2)
        : yaml.dump(this.data, { indent: 2 });
      await fs.writeFile(this.filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse configuration content based on file format
   */
  private parseConfig(content: string): ConfigData {
    try {
      return this.fileFormat === 'json'
        ? JSON.parse(content)
        : yaml.load(content) as ConfigData;
    } catch (error) {
      throw new Error(`Failed to parse config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine file format from extension
   */
  private determineFormat(filePath: string): 'json' | 'yaml' {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.json':
        return 'json';
      case '.yml':
      case '.yaml':
        return 'yaml';
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Get nested value using dot notation
   */
  private getNestedValue(obj: ConfigData, key: string): unknown {
    return key.split('.').reduce<unknown>((value: unknown, part: string) => {
      if (value && typeof value === 'object') {
        return (value as ConfigData)[part];
      }
      return undefined;
    }, obj);
  }

  /**
   * Set nested value using dot notation
   */
  private setNestedValue(obj: ConfigData, key: string, value: unknown): void {
    const parts = key.split('.');
    const lastPart = parts.pop()!;
    let current = obj;

    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as ConfigData;
    }

    current[lastPart] = value;
  }

  /**
   * Get all configuration keys using dot notation
   */
  private getAllKeys(obj: ConfigData, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return this.getAllKeys(value as ConfigData, fullKey);
      }
      return [fullKey];
    });
  }

  /**
   * Find changed keys between old and new data
   */
  private findChangedKeys(oldData: ConfigData, newData: ConfigData): string[] {
    const oldKeys = this.getAllKeys(oldData);
    const newKeys = this.getAllKeys(newData);
    const allKeys = new Set([...oldKeys, ...newKeys]);

    return Array.from(allKeys).filter(key => {
      const oldValue = this.getNestedValue(oldData, key);
      const newValue = this.getNestedValue(newData, key);
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });
  }
}