/**
 * Interface voor log formatter configuratie
 */
export interface ILogFormatterConfig {
  template?: string;
  timestampFormat?: string;
  options?: Record<string, any>;
}

/**
 * Interface voor log message formatting
 */
export interface ILogFormatter {
  /**
   * Formatter configuratie
   */
  readonly config: ILogFormatterConfig;

  /**
   * Formatteer log bericht
   * 
   * @param level - Log level
   * @param message - Origineel bericht
   * @param timestamp - Timestamp van log entry
   * @param metadata - Extra metadata
   * @returns Geformatteerd log bericht
   */
  format(
    level: string,
    message: string,
    timestamp: Date,
    metadata?: Record<string, any>
  ): string;

  /**
   * Parse template string
   * @param template - Template string
   */
  parseTemplate(template: string): void;
}