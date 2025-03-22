import * as bunyan from 'bunyan';
import { AbstractLoggerService } from '../abstract-logger.service';
import { ILoggerConfig, ILoggerDependencies } from '../../../interfaces/logging/logger.interface';
import { ILogTransport } from '../../../interfaces/logging/transport.interface';

/**
 * Bunyan specifieke transport configuratie
 */
interface IBunyanStreamConfig {
  level: bunyan.LogLevel;
  stream?: NodeJS.WritableStream;
  path?: string;
  type?: string;
}

/**
 * Adapter voor Bunyan logger implementatie
 */
export class BunyanLoggerAdapter extends AbstractLoggerService {
  private bunyanLogger: bunyan.Logger;

  constructor(dependencies: ILoggerDependencies, config: ILoggerConfig) {
    super(dependencies, config);

    // Creëer Bunyan logger instantie
    this.bunyanLogger = bunyan.createLogger({
      name: this.serviceId,
      level: this.mapLogLevel(config.level),
      streams: this.createBunyanStreams(config.transports)
    });
  }

  /**
   * Service ID implementatie
   */
  public get serviceId(): string {
    return 'bunyan.logger.service';
  }

  /**
   * Logger initialisatie
   */
  public async onInit(): Promise<void> {
    await super.onInit();
    this.log('info', 'Bunyan logger initialized');
  }

  /**
   * Logger cleanup
   */
  public async onDestroy(): Promise<void> {
    // Cleanup Bunyan resources
    this.bunyanLogger.streams.forEach((stream: bunyan.Stream) => {
      const writableStream = stream.stream as NodeJS.WritableStream;
      if (writableStream && typeof writableStream.end === 'function') {
        writableStream.end();
      }
    });
    await super.onDestroy();
  }

  /**
   * Config update handler
   */
  public async onConfigUpdate(config: Partial<ILoggerConfig>): Promise<void> {
    await super.onConfigUpdate(config);

    // Recreate logger with new config if needed
    if (config.level || config.transports) {
      this.bunyanLogger = bunyan.createLogger({
        name: this.serviceId,
        level: this.mapLogLevel(config.level || this.config?.level || 'info'),
        streams: config.transports 
          ? this.createBunyanStreams(config.transports)
          : this.bunyanLogger.streams
      });
    }
  }

  /**
   * Map log levels naar Bunyan levels
   */
  private mapLogLevel(level: string): bunyan.LogLevel {
    const levelMap: Record<string, bunyan.LogLevel> = {
      error: 'error',
      warn: 'warn',
      info: 'info',
      debug: 'debug'
    };
    return levelMap[level] || 'info';
  }

  /**
   * Creëer Bunyan streams van ILogTransport interfaces
   */
  private createBunyanStreams(transports: ILogTransport[]): bunyan.Stream[] {
    return transports.map(transport => {
      const config: IBunyanStreamConfig = {
        level: this.mapLogLevel(transport.config.level)
      };

      // Map transport options naar Bunyan config
      if (transport.config.options) {
        Object.assign(config, transport.config.options);
      }

      // Default naar stdout stream als geen specifiek type opgegeven
      if (!config.stream && !config.path) {
        config.stream = process.stdout;
      }

      return config;
    });
  }

  /**
   * Log implementatie via Bunyan
   */
  protected async logMessage(
    level: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const bunyanLevel = this.mapLogLevel(level);
    this.bunyanLogger[bunyanLevel]({ ...metadata }, message);
  }
}