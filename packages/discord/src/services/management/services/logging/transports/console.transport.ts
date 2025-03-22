import { ILogTransport, ILogTransportConfig } from '../../../interfaces/logging/transport.interface';

/**
 * Console transport configuratie
 */
export interface IConsoleTransportConfig extends ILogTransportConfig {
  colorize?: boolean;
  timestamp?: boolean;
}

/**
 * Basis console transport implementatie
 */
export class ConsoleTransport implements ILogTransport {
  private _config: IConsoleTransportConfig;

  constructor(config: IConsoleTransportConfig) {
    this._config = {
      level: config.level || 'info',
      colorize: config.colorize ?? true,
      timestamp: config.timestamp ?? true,
      ...config.options
    };
  }

  /**
   * Getter voor transport configuratie
   */
  public get config(): IConsoleTransportConfig {
    return this._config;
  }

  /**
   * Initialiseer transport
   */
  public async initialize(): Promise<void> {
    // Console transport heeft geen initialisatie nodig
  }

  /**
   * Cleanup transport resources
   */
  public async close(): Promise<void> {
    // Console transport heeft geen cleanup nodig
  }

  /**
   * Schrijf log entry naar console
   */
  public async write(
    level: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const timestamp = this._config.timestamp ? `[${new Date().toISOString()}] ` : '';
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const output = `${timestamp}${level.toUpperCase()}: ${message}${metadataStr}`;

    switch (level) {
      case 'error':
        console.error(this.colorize('red', output));
        break;
      case 'warn':
        console.warn(this.colorize('yellow', output));
        break;
      case 'debug':
        console.debug(this.colorize('blue', output));
        break;
      default:
        console.log(this.colorize('green', output));
    }
  }

  /**
   * Voeg kleuren toe aan output als enabled
   */
  private colorize(color: string, text: string): string {
    if (!this._config.colorize) {
      return text;
    }

    const colors: Record<string, [number, number]> = {
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39]
    };

    const [open, close] = colors[color] || [0, 0];
    return `\u001b[${open}m${text}\u001b[${close}m`;
  }
}