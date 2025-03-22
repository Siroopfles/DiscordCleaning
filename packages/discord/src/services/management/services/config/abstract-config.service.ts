import { DiscordClient } from '../../../../types';
import { BaseService } from '../../../base.service';
import {
  ConfigChangeEvent,
  ConfigProviderOptions,
  ConfigSchema,
  ConfigValue,
  ValidationResult
} from '../../interfaces/config/types';
import { IConfigProvider } from '../../interfaces/config/config-provider.interface';
import { IConfigService } from '../../interfaces/config/config-service.interface';
import { IConfigValidator } from '../../interfaces/config/config-validator.interface';

/**
 * Abstract base class for config management service
 * Provides core functionality for config management while allowing specific implementations
 */
export abstract class AbstractConfigService extends BaseService implements IConfigService {
  protected readonly _providers: Map<string, IConfigProvider>;
  protected readonly _changeListeners: Set<(event: ConfigChangeEvent) => void>;

  constructor(
    client: DiscordClient,
    protected readonly _validator: IConfigValidator
  ) {
    super(client);
    this._providers = new Map();
    this._changeListeners = new Set();
  }

  public get validator(): IConfigValidator {
    return this._validator;
  }

  public get providers(): Map<string, IConfigProvider> {
    return this._providers;
  }

  public async registerProvider(options: ConfigProviderOptions): Promise<void> {
    if (this._providers.has(options.name)) {
      throw new Error(`Provider '${options.name}' already registered`);
    }

    const provider = await this.createProvider(options);
    await provider.initialize();

    if (options.schema) {
      await this._validator.addSchema(options.name, options.schema);
    }

    this._providers.set(options.name, provider);

    // Set up change detection
    await provider.watch((key, value) => {
      this.notifyChange(key, value);
    });

    this.log('info', `Registered config provider: ${options.name}`);
  }

  public async removeProvider(name: string): Promise<void> {
    const provider = this._providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found`);
    }

    await provider.unwatch();
    await provider.dispose();
    this._providers.delete(name);

    if (await this._validator.hasSchema(name)) {
      await this._validator.removeSchema(name);
    }

    this.log('info', `Removed config provider: ${name}`);
  }

  public async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.getRaw<T>(key);
    return value ? value.value : defaultValue;
  }

  public async set<T>(
    key: string,
    value: T,
    options?: { provider?: string; isSecret?: boolean }
  ): Promise<void> {
    const provider = options?.provider
      ? this._providers.get(options.provider)
      : this.getDefaultProvider();

    if (!provider) {
      throw new Error('No config provider available');
    }

    await provider.set(key, value);
  }

  public async getRaw<T>(key: string): Promise<ConfigValue<T> | undefined> {
    for (const provider of this.getOrderedProviders()) {
      const value = await provider.get<T>(key);
      if (value) {
        return value;
      }
    }
    return undefined;
  }

  public async has(key: string): Promise<boolean> {
    for (const provider of this.getOrderedProviders()) {
      if (await provider.has(key)) {
        return true;
      }
    }
    return false;
  }

  public async keys(): Promise<string[]> {
    const keySets = await Promise.all(
      this.getOrderedProviders().map(provider => provider.keys())
    );
    return Array.from(new Set(keySets.flat()));
  }

  public async registerSchema(name: string, schema: ConfigSchema): Promise<void> {
    await this._validator.addSchema(name, schema);
    this.log('info', `Registered config schema: ${name}`);
  }

  public async validate(schemaName: string, value: unknown): Promise<ValidationResult> {
    return this._validator.validate(schemaName, value);
  }

  public subscribe(callback: (event: ConfigChangeEvent) => void): void {
    this._changeListeners.add(callback);
  }

  public unsubscribe(callback: (event: ConfigChangeEvent) => void): void {
    this._changeListeners.delete(callback);
  }

  public async refresh(): Promise<void> {
    await Promise.all(
      Array.from(this._providers.values()).map(provider => provider.refresh())
    );
  }

  public async snapshot(): Promise<Record<string, ConfigValue>> {
    const keys = await this.keys();
    const snapshot: Record<string, ConfigValue> = {};

    for (const key of keys) {
      const value = await this.getRaw(key);
      if (value) {
        snapshot[key] = value;
      }
    }

    return snapshot;
  }

  protected async initialize(): Promise<void> {
    // Implementation deferred to concrete classes
  }

  /**
   * Create a new config provider instance
   * Abstract method to be implemented by concrete classes
   */
  protected abstract createProvider(options: ConfigProviderOptions): Promise<IConfigProvider>;

  /**
   * Get providers ordered by priority
   */
  protected getOrderedProviders(): IConfigProvider[] {
    return Array.from(this._providers.values()).sort((a, b) =>
      (b.options.priority || 0) - (a.options.priority || 0)
    );
  }

  /**
   * Get the default provider (highest priority)
   */
  protected getDefaultProvider(): IConfigProvider | undefined {
    return this.getOrderedProviders()[0];
  }

  /**
   * Notify change listeners of configuration changes
   */
  protected notifyChange(key: string, newValue: ConfigValue): void {
    const event: ConfigChangeEvent = {
      key,
      newValue,
      timestamp: Date.now()
    };

    for (const listener of this._changeListeners) {
      try {
        listener(event);
      } catch (error) {
        this.log('error', `Error in config change listener: ${error}`);
      }
    }
  }
}