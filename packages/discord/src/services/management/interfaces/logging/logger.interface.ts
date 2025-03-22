import { IBaseService, IServiceDependencies } from '../../../core/interfaces/base/service.interface';
import { ILogFormatter } from './formatter.interface';
import { ILogTransport } from './transport.interface';

/**
 * Logger service configuratie 
 */
export interface ILoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  transports: ILogTransport[];
  formatter?: ILogFormatter;
  metadata?: Record<string, any>;
}

/**
 * Logger service dependencies
 */
export interface ILoggerDependencies extends IServiceDependencies {
  formatter?: ILogFormatter;
}

/**
 * Interface voor logging service implementatie
 */
export interface ILoggerService extends IBaseService<ILoggerDependencies, ILoggerConfig> {
  /**
   * Actieve log level
   */
  readonly level: string;

  /**
   * Geconfigureerde transports
   */
  readonly transports: ILogTransport[];

  /**
   * Logger formatter
   */
  readonly formatter?: ILogFormatter;

  /**
   * Log een debug message
   * @param message - Debug bericht
   * @param metadata - Extra metadata
   */
  debug(message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Log een info message
   * @param message - Info bericht  
   * @param metadata - Extra metadata
   */
  info(message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Log een warning message
   * @param message - Warning bericht
   * @param metadata - Extra metadata  
   */
  warn(message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Log een error message
   * @param message - Error bericht
   * @param metadata - Extra metadata
   */
  error(message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Voeg transport toe aan logger
   * @param transport - Transport implementatie
   */
  addTransport(transport: ILogTransport): Promise<void>;

  /**
   * Verwijder transport van logger
   * @param transport - Transport implementatie
   */
  removeTransport(transport: ILogTransport): Promise<void>;

  /**
   * Update logger formatter
   * @param formatter - Nieuwe formatter
   */
  setFormatter(formatter: ILogFormatter): void;
}