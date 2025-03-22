import 'reflect-metadata';
import { IBaseService, IServiceDependencies } from '../../interfaces/base/service.interface';

/**
 * Abstract base class voor alle services
 * Implementeert core functionaliteit en lifecycle management
 * 
 * @template TDependencies - Type voor service dependencies, moet IServiceDependencies extenden
 * @template TConfig - Type voor service configuratie
 */
export abstract class AbstractBaseService<
  TDependencies extends IServiceDependencies = IServiceDependencies,  
  TConfig = unknown
> implements IBaseService<TDependencies, TConfig> {
  
  private _initialized = false;
  private _ready = false;
  private _internalDependencies: TDependencies;
  private _internalConfig?: TConfig;

  /**
   * Service constructor
   * 
   * @param dependencies - Service dependencies
   * @param config - Optionele service configuratie
   */
  constructor(dependencies: TDependencies, config?: TConfig) {
    this._internalDependencies = dependencies;
    this._internalConfig = config;

    // Valideer required dependencies
    this.validateDependencies(dependencies);
  }

  /**
   * Getter voor service dependencies
   */
  public get dependencies(): TDependencies {
    return this._internalDependencies;
  }

  /**
   * Protected dependencies voor gebruik in afgeleide classes
   */
  protected get _dependencies(): TDependencies {
    return this._internalDependencies;
  }

  /**
   * Getter voor service configuratie
   */
  public get config(): TConfig | undefined {
    return this._internalConfig;
  }

  /**
   * Protected config voor gebruik in afgeleide classes
   */
  protected get _config(): TConfig | undefined {
    return this._internalConfig;
  }

  /**
   * Service ID implementatie
   * Moet uniek zijn per service instantie
   */
  public abstract get serviceId(): string;

  /**
   * Valideer dependencies bij constructie
   * @throws Error als required dependencies ontbreken
   */
  private validateDependencies(dependencies: TDependencies) {
    if (!dependencies.client) {
      throw new Error(`${this.constructor.name}: Missing required dependency 'client'`);
    }
    if (!dependencies.logger) {
      throw new Error(`${this.constructor.name}: Missing required dependency 'logger'`);
    }
  }

  /**
   * Initialiseer de service
   * Handelt lifecycle hooks af in de juiste volgorde
   */
  public async initialize(): Promise<void> {
    try {
      if (this._initialized) {
        return;
      }

      // Pre-init validatie
      this.validateDependencies(this.dependencies);

      // Roep onInit aan als het geïmplementeerd is
      if (this.onInit) {
        await this.onInit();
      }

      this._initialized = true;

      // Roep onReady aan als het geïmplementeerd is
      if (this.onReady) {
        await this.onReady();
      }

      this._ready = true;
    } catch (error) {
      // Error boundary - log error en propagate
      this.log('error', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update service configuratie
   * @param config - Nieuwe configuratie waardes
   */
  public async updateConfig(config: Partial<TConfig>): Promise<void> {
    try {
      if (!this._initialized) {
        throw new Error('Service must be initialized before updating config');
      }

      // Merge nieuwe config
      this._internalConfig = {
        ...this._internalConfig,
        ...config
      } as TConfig;

      // Notify service van config update
      if (this.onConfigUpdate) {
        await this.onConfigUpdate(config);
      }
    } catch (error) {
      this.log('error', `Config update failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update service dependencies
   * @param dependencies - Nieuwe dependency waardes
   */
  public async updateDependencies(dependencies: Partial<TDependencies>): Promise<void> {
    try {
      if (!this._initialized) {
        throw new Error('Service must be initialized before updating dependencies');
      }

      // Merge nieuwe dependencies
      Object.assign(this._internalDependencies, dependencies);

      // Valideer dependencies na update
      this.validateDependencies(this._internalDependencies);

      // Notify service van dependency update
      if (this.onDependenciesUpdate) {
        await this.onDependenciesUpdate(dependencies);
      }
    } catch (error) {
      this.log('error', `Dependencies update failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Cleanup service resources
   */
  public async destroy(): Promise<void> {
    try {
      if (!this._initialized) {
        return;
      }

      // Roep onDestroy aan als het geïmplementeerd is
      if (this.onDestroy) {
        await this.onDestroy();
      }

      this._initialized = false;
      this._ready = false;
    } catch (error) {
      this.log('error', `Destroy failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Check of service geïnitialiseerd is
   * @throws Error als service niet geïnitialiseerd is
   */
  protected ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error('Service is not initialized');
    }
  }

  /**
   * Check of service ready is
   * @throws Error als service niet ready is
   */
  protected ensureReady(): void {
    if (!this._ready) {
      throw new Error('Service is not ready');
    }
  }

  /**
   * Logging utility methode
   * Voegt service context toe aan log berichten
   */
  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void {
    const logMessage = `[${this.constructor.name}] ${message}`;
    this.dependencies.logger[level](logMessage, ...args);
  }

  // Lifecycle hook implementaties (optioneel)
  public async onInit?(): Promise<void>;
  public async onReady?(): Promise<void>;
  public async onConfigUpdate?(config: Partial<TConfig>): Promise<void>;
  public async onDependenciesUpdate?(dependencies: Partial<TDependencies>): Promise<void>;
  public async onDestroy?(): Promise<void>;
}