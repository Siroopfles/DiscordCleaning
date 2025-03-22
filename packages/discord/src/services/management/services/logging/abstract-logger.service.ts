import { AbstractBaseService } from '../../../core/services/base/service.base';
import { ILogFormatter } from '../../interfaces/logging/formatter.interface';
import { ILoggerConfig, ILoggerDependencies, ILoggerService } from '../../interfaces/logging/logger.interface';
import { ILogTransport } from '../../interfaces/logging/transport.interface';

/**
 * Abstracte basis implementatie van logging service
 */
export abstract class AbstractLoggerService 
  extends AbstractBaseService<ILoggerDependencies, ILoggerConfig>
  implements ILoggerService {

  private _transports: ILogTransport[] = [];
  private _formatter?: ILogFormatter;

  constructor(
    dependencies: ILoggerDependencies,
    config: ILoggerConfig
  ) {
    super(dependencies, config);
    
    if (config.formatter) {
      this._formatter = config.formatter;
    }

    // Configureer initiele transports
    if (config.transports) {
      this._transports = [...config.transports];
    }
  }

  /**
   * Service ID implementatie
   */
  public get serviceId(): string {
    return 'logger.service';
  }

  /**
   * Actieve log level
   */
  public get level(): string {
    return this.config?.level || 'info';
  }

  /**
   * Getter voor transports array
   */
  public get transports(): ILogTransport[] {
    return this._transports;
  }

  /**
   * Getter voor formatter
   */
  public get formatter(): ILogFormatter | undefined {
    return this._formatter;
  }

  /**
   * Initialiseer logger service
   */
  public async onInit(): Promise<void> {
    // Initialiseer alle transports
    await Promise.all(
      this._transports.map(transport => transport.initialize())
    );
  }

  /**
   * Cleanup logger resources
   */
  public async onDestroy(): Promise<void> {
    // Cleanup alle transports
    await Promise.all(
      this._transports.map(transport => transport.close())
    );
  }

  /**
   * Log een debug message
   */
  public async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.logMessage('debug', message, metadata);
  }

  /**
   * Log een info message
   */
  public async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.logMessage('info', message, metadata);
  }

  /**
   * Log een warning message
   */
  public async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.logMessage('warn', message, metadata);
  }

  /**
   * Log een error message
   */
  public async error(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.logMessage('error', message, metadata);
  }

  /**
   * Voeg transport toe aan logger
   */
  public async addTransport(transport: ILogTransport): Promise<void> {
    this.ensureInitialized();
    await transport.initialize();
    this._transports.push(transport);
  }

  /**
   * Verwijder transport van logger
   */
  public async removeTransport(transport: ILogTransport): Promise<void> {
    this.ensureInitialized();
    const index = this._transports.indexOf(transport);
    if (index > -1) {
      await transport.close();
      this._transports.splice(index, 1);
    }
  }

  /**
   * Update logger formatter
   */
  public setFormatter(formatter: ILogFormatter): void {
    this._formatter = formatter;
  }

  /**
   * Interne methode voor het loggen van berichten
   */
  protected async logMessage(
    level: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    this.ensureInitialized();

    const timestamp = new Date();
    const formattedMessage = this._formatter
      ? this._formatter.format(level, message, timestamp, metadata)
      : message;

    // Log naar alle transports
    await Promise.all(
      this._transports.map(transport =>
        transport.write(level, formattedMessage, metadata)
      )
    );
  }

  /**
   * Config update handler
   */
  public async onConfigUpdate(config: Partial<ILoggerConfig>): Promise<void> {
    if (config.formatter) {
      this.setFormatter(config.formatter);
    }
  }
}