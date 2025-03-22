import * as winston from 'winston';
import { AbstractLoggerService } from '../abstract-logger.service';
import { ILoggerConfig, ILoggerDependencies } from '../../../interfaces/logging/logger.interface';
import { ILogTransport } from '../../../interfaces/logging/transport.interface';

/**
 * Winston specifieke transport configuratie
 */
interface IWinstonTransportConfig {
  level: string;
  silent?: boolean;
  format?: winston.Logform.Format;
}

/**
 * Adapter voor Winston logger implementatie
 */
export class WinstonLoggerAdapter extends AbstractLoggerService {
  private winstonLogger: winston.Logger;

  constructor(dependencies: ILoggerDependencies, config: ILoggerConfig) {
    super(dependencies, config);

    // Creëer Winston logger instantie
    this.winstonLogger = winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });

    // Configureer transports
    this.configureTransports(config.transports);
  }

  /**
   * Service ID implementatie
   */
  public get serviceId(): string {
    return 'winston.logger.service';
  }

  /**
   * Logger initialisatie
   */
  public async onInit(): Promise<void> {
    await super.onInit();
    this.log('info', 'Winston logger initialized');
  }

  /**
   * Logger cleanup
   */
  public async onDestroy(): Promise<void> {
    // Cleanup Winston resources
    this.winstonLogger.clear();
    this.winstonLogger.close();
    await super.onDestroy();
  }

  /**
   * Config update handler
   */
  public async onConfigUpdate(config: Partial<ILoggerConfig>): Promise<void> {
    await super.onConfigUpdate(config);

    if (config.level) {
      this.winstonLogger.level = config.level;
    }

    if (config.transports) {
      this.configureTransports(config.transports);
    }
  }

  /**
   * Protected helper voor het configureren van Winston transports
   */
  protected configureTransports(transports: ILogTransport[]): void {
    // Verwijder bestaande transports
    this.winstonLogger.clear();

    // Configureer nieuwe transports
    transports.forEach(transport => {
      const winstonTransport = this.createWinstonTransport(transport);
      this.winstonLogger.add(winstonTransport);
    });
  }

  /**
   * Creëer Winston transport van ILogTransport interface
   */
  private createWinstonTransport(transport: ILogTransport): winston.transport {
    const config = {
      level: transport.config.level || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      silent: false
    } as winston.transports.ConsoleTransportOptions;

    // Map transport opties naar Winston config
    if (transport.config.options) {
      Object.assign(config, transport.config.options);
    }

    // Default naar console transport als geen specifiek type opgegeven
    return new winston.transports.Console(config);
  }

  /**
   * Log implementatie via Winston
   */
  protected async logMessage(
    level: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    this.winstonLogger.log(level, message, metadata);
  }
}