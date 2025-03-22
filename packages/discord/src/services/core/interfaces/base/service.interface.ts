import { DiscordClient } from '../../../../types';
import { IServiceLifecycle } from './lifecycle.interface';

/**
 * Interface voor service dependencies management
 */
export interface IServiceDependencies {
  client: DiscordClient;
  logger: Console | {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  };
}

/**
 * Basis interface voor alle services
 * 
 * @template TDependencies - Type voor service dependencies, extends IServiceDependencies
 * @template TConfig - Type voor service configuratie
 */
export interface IBaseService<
  TDependencies extends IServiceDependencies = IServiceDependencies,
  TConfig = unknown
> extends IServiceLifecycle<TDependencies, TConfig> {
  /**
   * Service dependencies
   */
  readonly dependencies: TDependencies;

  /**
   * Service configuratie
   */
  readonly config?: TConfig;

  /**
   * Service identificatie
   */
  readonly serviceId: string;

  /**
   * Initialiseer de service
   */
  initialize(): Promise<void>;

  /**
   * Update service configuratie
   * @param config - Nieuwe configuratie waardes
   */
  updateConfig(config: Partial<TConfig>): Promise<void>;

  /**
   * Update service dependencies
   * @param dependencies - Nieuwe dependency waardes
   */
  updateDependencies(dependencies: Partial<TDependencies>): Promise<void>;

  /**
   * Cleanup service resources
   */
  destroy(): Promise<void>;

  /**
   * Logging utility methode
   * 
   * @param level - Log level
   * @param message - Log bericht
   * @param args - Extra argumenten
   */
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void;
}