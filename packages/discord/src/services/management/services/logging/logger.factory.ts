import { ServiceFactory } from '../../../core/services/base/factory.base';
import { IServiceConstructor } from '../../../core/interfaces/base/factory.interface';
import { ILoggerFactory } from '../../interfaces/logging/logger-factory.interface';
import { ILoggerConfig, ILoggerDependencies, ILoggerService } from '../../interfaces/logging/logger.interface';
import { WinstonLoggerAdapter } from './adapters/winston-logger.adapter';
import { BunyanLoggerAdapter } from './adapters/bunyan-logger.adapter';

type LoggerConstructor = IServiceConstructor<ILoggerService, ILoggerDependencies, ILoggerConfig>;

/**
 * Factory voor het creëren van logger instances
 */
export class LoggerFactory 
  extends ServiceFactory<ILoggerService, ILoggerDependencies, ILoggerConfig>
  implements ILoggerFactory {

  constructor(dependencies: ILoggerDependencies) {
    super(dependencies);
  }

  /**
   * Creëer een nieuwe Winston logger
   */
  public createWinstonLogger(config: ILoggerConfig): ILoggerService {
    return this.createService(
      WinstonLoggerAdapter as unknown as LoggerConstructor,
      this.validateConfig(config)
    );
  }

  /**
   * Creëer een nieuwe Bunyan logger
   */
  public createBunyanLogger(config: ILoggerConfig): ILoggerService {
    return this.createService(
      BunyanLoggerAdapter as unknown as LoggerConstructor,
      this.validateConfig(config)
    );
  }

  /**
   * Registreer een Winston logger
   */
  public registerWinstonLogger(serviceId: string, config: ILoggerConfig): void {
    this.registerService(
      serviceId,
      WinstonLoggerAdapter as unknown as LoggerConstructor,
      this.validateConfig(config)
    );
  }

  /**
   * Registreer een Bunyan logger
   */
  public registerBunyanLogger(serviceId: string, config: ILoggerConfig): void {
    this.registerService(
      serviceId,
      BunyanLoggerAdapter as unknown as LoggerConstructor,
      this.validateConfig(config)
    );
  }

  /**
   * Helper voor config validatie
   */
  private validateConfig(config: ILoggerConfig): ILoggerConfig {
    return {
      level: config.level || 'info',
      transports: config.transports || [],
      formatter: config.formatter,
      metadata: config.metadata || {}
    };
  }
}