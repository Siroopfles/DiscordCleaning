import { Client } from 'discord.js';

export interface DiscordConfig {
  token: string;
  clientId: string;
  guildId?: string;
  apiBaseUrl?: string;
}

export interface DiscordClientOptions {
  config: DiscordConfig;
  services?: DiscordServices;
}

export interface DiscordServices {
  logger?: Logger;
}

export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export interface DiscordClient extends Client {
  config: DiscordConfig;
  services: DiscordServices;
}

/**
 * Constructor type voor classes
 */
export type Constructor<T = any> = new (...args: any[]) => T;