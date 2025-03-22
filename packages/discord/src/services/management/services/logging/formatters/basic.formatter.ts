import { ILogFormatter, ILogFormatterConfig } from '../../../interfaces/logging/formatter.interface';

/**
 * Configuratie voor basic formatter
 */
export interface IBasicFormatterConfig extends ILogFormatterConfig {
  includeTimestamp?: boolean;
  timestampFormat?: string;
  includeMeta?: boolean;
  template?: string;
}

/**
 * Basis formatter implementatie
 */
export class BasicFormatter implements ILogFormatter {
  private _config: IBasicFormatterConfig;
  private _template: string;

  constructor(config: IBasicFormatterConfig = {}) {
    this._config = {
      includeTimestamp: true,
      timestampFormat: 'ISO',
      includeMeta: true,
      template: '{{timestamp}} [{{level}}] {{message}}{{meta}}',
      ...config
    };

    this._template = this._config.template || '';
    if (this._template) {
      this.parseTemplate(this._template);
    }
  }

  /**
   * Getter voor formatter configuratie
   */
  public get config(): IBasicFormatterConfig {
    return this._config;
  }

  /**
   * Parse template string
   */
  public parseTemplate(template: string): void {
    this._template = template;
  }

  /**
   * Format log bericht volgens template
   */
  public format(
    level: string,
    message: string,
    timestamp: Date,
    metadata?: Record<string, any>
  ): string {
    let output = this._template;

    // Vervang template placeholders
    if (this._config.includeTimestamp) {
      const timestampStr = this.formatTimestamp(timestamp);
      output = output.replace('{{timestamp}}', timestampStr);
    } else {
      output = output.replace('{{timestamp}}', '');
    }

    output = output.replace('{{level}}', level.toUpperCase());
    output = output.replace('{{message}}', message);

    if (this._config.includeMeta && metadata) {
      const metaStr = JSON.stringify(metadata);
      output = output.replace('{{meta}}', ` ${metaStr}`);
    } else {
      output = output.replace('{{meta}}', '');
    }

    // Clean up any remaining template tags
    output = output.replace(/{{.*?}}/g, '');

    return output.trim();
  }

  /**
   * Format timestamp volgens configuratie
   */
  private formatTimestamp(timestamp: Date): string {
    switch (this._config.timestampFormat) {
      case 'ISO':
        return timestamp.toISOString();
      case 'UTC':
        return timestamp.toUTCString();
      case 'locale':
        return timestamp.toLocaleString();
      default:
        return timestamp.toISOString();
    }
  }
}