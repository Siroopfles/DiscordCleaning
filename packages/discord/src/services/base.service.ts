import { DiscordClient } from '../types';

export abstract class BaseService {
  protected readonly client: DiscordClient;
  protected readonly logger: Console | {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  };

  constructor(client: DiscordClient) {
    this.client = client;
    this.logger = client.services.logger || console;
  }

  protected abstract initialize(): Promise<void>;

  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void {
    this.logger[level](message, ...args);
  }
}

export interface ServiceConstructor {
  new (client: DiscordClient): BaseService;
}