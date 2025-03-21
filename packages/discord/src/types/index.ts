import { Client } from 'discord.js';
import { ApiService } from './api';
import { MonitoringService, RateLimiterService } from '../services';

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
  api?: ApiService;
  rateLimiter?: RateLimiterService;
  monitoring?: MonitoringService;
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

export * from './notification';
export * from './api';