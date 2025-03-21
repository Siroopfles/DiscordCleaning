import { BaseService } from './base.service';
import { DiscordClient, Logger, LoggerConfig, LogLevel } from '../types';
import winston from 'winston';
import { join } from 'path';

export class LoggerService extends BaseService implements Logger {
  private winston: winston.Logger;
  private config: LoggerConfig;

  constructor(client: DiscordClient, config?: Partial<LoggerConfig>) {
    super(client);
    
    this.config = {
      level: config?.level || 'info',
      format: config?.format || 'json',
      timestamp: config?.timestamp !== false,
      colorize: config?.colorize !== false,
      transports: {
        console: config?.transports?.console !== false,
        file: config?.transports?.file
      }
    };

    this.winston = this.createLogger();
  }

  public async initialize(): Promise<void> {
    this.log('info', 'Logger service initialized');
    return Promise.resolve();
  }

  private createLogger(): winston.Logger {
    const formats = [
      this.config.timestamp && winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      this.config.format === 'json' ? winston.format.json() : winston.format.simple(),
      this.config.colorize && winston.format.colorize()
    ].filter(Boolean) as winston.Logform.Format[];

    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.transports?.console) {
      transports.push(new winston.transports.Console());
    }

    // File transport
    if (this.config.transports?.file) {
      const { filename, maxSize = 5242880, maxFiles = 5 } = this.config.transports.file;
      transports.push(
        new winston.transports.File({
          filename: join(process.cwd(), 'logs', filename),
          maxsize: maxSize,
          maxFiles: maxFiles,
          tailable: true
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(...formats),
      transports
    });
  }

  info(message: string, ...args: any[]): void {
    this.logWithLevel('info', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logWithLevel('error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logWithLevel('warn', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logWithLevel('debug', message, ...args);
  }

  private logWithLevel(level: LogLevel, message: string, ...args: any[]): void {
    const metadata = args.length > 0 ? args[0] : {};
    
    this.winston.log(level, message, {
      ...metadata,
      service: 'discord'
    });
  }

  setLogLevel(level: LogLevel): void {
    this.config.level = level;
    this.winston.level = level;
  }

  getLogLevel(): LogLevel {
    return this.config.level;
  }
}