import { IServiceFactory } from '../../../core/interfaces/base/factory.interface';
import { ILoggerService, ILoggerDependencies, ILoggerConfig } from './logger.interface';

/**
 * Factory interface voor logger instantiatie
 */
export interface ILoggerFactory extends IServiceFactory<ILoggerService, ILoggerDependencies, ILoggerConfig> {
  /**
   * Creëer een nieuwe Winston logger
   * @param config - Logger configuratie
   * @returns Winston logger instantie
   */
  createWinstonLogger(config: ILoggerConfig): ILoggerService;

  /**
   * Creëer een nieuwe Bunyan logger
   * @param config - Logger configuratie
   * @returns Bunyan logger instantie
   */
  createBunyanLogger(config: ILoggerConfig): ILoggerService;

  /**
   * Registreer een Winston logger
   * @param serviceId - Unieke service identifier
   * @param config - Logger configuratie
   */
  registerWinstonLogger(serviceId: string, config: ILoggerConfig): void;

  /**
   * Registreer een Bunyan logger
   * @param serviceId - Unieke service identifier
   * @param config - Logger configuratie
   */
  registerBunyanLogger(serviceId: string, config: ILoggerConfig): void;
}