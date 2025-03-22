import { AbstractConfigProvider } from '../abstract-config-provider';
import { ConfigProviderOptions, ConfigSourceType, ConfigValue } from '../../../interfaces/config';

interface Transaction {
  changes: Map<string, unknown>;
  timestamp: number;
}

/**
 * In-memory configuration provider with transaction support
 */
export class MemoryConfigProvider extends AbstractConfigProvider {
  private data: Map<string, unknown>;
  private transactions: Map<string, Transaction>;
  private activeTransaction?: string;

  constructor(options: ConfigProviderOptions) {
    super({
      ...options,
      type: ConfigSourceType.MEMORY
    });
    this.data = new Map();
    this.transactions = new Map();
  }

  /**
   * Begin a new transaction
   * @returns Transaction ID
   */
  public async beginTransaction(): Promise<string> {
    if (this.activeTransaction) {
      throw new Error('Another transaction is already active');
    }

    const txId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.transactions.set(txId, {
      changes: new Map(),
      timestamp: Date.now()
    });
    this.activeTransaction = txId;
    return txId;
  }

  /**
   * Commit an active transaction
   * @param txId Transaction ID
   */
  public async commitTransaction(txId: string): Promise<void> {
    const transaction = this.transactions.get(txId);
    if (!transaction) {
      throw new Error(`Transaction ${txId} not found`);
    }

    if (this.activeTransaction !== txId) {
      throw new Error(`Transaction ${txId} is not active`);
    }

    // Apply all changes
    for (const [key, value] of transaction.changes) {
      await this.set(key, value);
    }

    // Cleanup
    this.transactions.delete(txId);
    this.activeTransaction = undefined;
  }

  /**
   * Rollback an active transaction
   * @param txId Transaction ID
   */
  public async rollbackTransaction(txId: string): Promise<void> {
    const transaction = this.transactions.get(txId);
    if (!transaction) {
      throw new Error(`Transaction ${txId} not found`);
    }

    if (this.activeTransaction !== txId) {
      throw new Error(`Transaction ${txId} is not active`);
    }

    // Cleanup without applying changes
    this.transactions.delete(txId);
    this.activeTransaction = undefined;
  }

  /**
   * Initialize the provider
   */
  public async initialize(): Promise<void> {
    // Memory provider doesn't require initialization
  }

  /**
   * Get a configuration value
   * @param key Configuration key
   */
  public async get<T>(key: string): Promise<ConfigValue<T> | undefined> {
    const value = this.data.get(key) as T;
    
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
    if (this.activeTransaction) {
      // In transaction mode, store changes in transaction
      const transaction = this.transactions.get(this.activeTransaction)!;
      transaction.changes.set(key, value);
      return;
    }

    const oldValue = this.data.get(key);
    this.data.set(key, value);

    // Only notify if value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      this.notifyChange(key, {
        value,
        source: this.options.type,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check if a configuration key exists
   * @param key Configuration key
   */
  public async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  /**
   * Get all configuration keys
   */
  public async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  /**
   * Refresh configuration values
   */
  public async refresh(): Promise<void> {
    // Memory provider doesn't require refresh
  }

  /**
   * Start watching for configuration changes
   * Note: Memory provider doesn't need watching as changes are instant
   */
  protected async startWatching(): Promise<void> {
    // No-op - changes are handled in set()
  }

  /**
   * Stop watching for configuration changes
   */
  protected async stopWatching(): Promise<void> {
    // No-op
  }

  /**
   * Clean up provider resources
   */
  protected async cleanup(): Promise<void> {
    this.data.clear();
    this.transactions.clear();
    this.activeTransaction = undefined;
  }

  /**
   * Load initial data
   * @param data Initial configuration data
   */
  public async load(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }

  /**
   * Get all configuration as record
   */
  public async dump(): Promise<Record<string, unknown>> {
    return Object.fromEntries(this.data.entries());
  }

  /**
   * Remove a configuration value
   * @param key Configuration key to remove
   */
  public async remove(key: string): Promise<void> {
    if (this.data.has(key)) {
      this.data.delete(key);
      this.notifyChange(key, {
        value: undefined,
        source: this.options.type,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Clear all configuration values
   */
  public async clear(): Promise<void> {
    const keys = Array.from(this.data.keys());
    this.data.clear();
    
    // Notify about cleared values
    for (const key of keys) {
      this.notifyChange(key, {
        value: undefined,
        source: this.options.type,
        timestamp: Date.now()
      });
    }
  }
}