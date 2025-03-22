/**
 * Interface voor log transport configuratie
 */
export interface ILogTransportConfig {
  level: string;
  format?: string;
  options?: Record<string, any>;
}

/**
 * Interface voor log transport implementatie
 */
export interface ILogTransport {
  /**
   * Transport configuratie
   */
  readonly config: ILogTransportConfig;

  /**
   * Schrijf log entry naar transport target
   * @param level - Log level
   * @param message - Log bericht
   * @param metadata - Extra metadata
   */
  write(level: string, message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Initialiseer transport
   */
  initialize(): Promise<void>;

  /**
   * Cleanup transport resources
   */
  close(): Promise<void>;
}