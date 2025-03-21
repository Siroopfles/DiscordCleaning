import { Client, GatewayIntentBits } from 'discord.js';
import { DiscordClient, DiscordClientOptions } from '../types';
import { createApiService, createRateLimiterService, createMonitoringService } from '../services';

export function createDiscordClient(options: DiscordClientOptions): DiscordClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  }) as DiscordClient;

  client.config = options.config;
  client.services = options.services || {};

  // Initialize logger if not provided
  const logger = options.services?.logger || console;
  client.services.logger = logger;

  // Initialize monitoring service
  client.services.monitoring = createMonitoringService(logger);

  // Initialize API service if baseUrl is provided
  if (options.config.apiBaseUrl) {
    client.services.api = createApiService(
      options.config.apiBaseUrl,
      logger
    );
  }

  // Initialize rate limiter service
  client.services.rateLimiter = createRateLimiterService(
    5, // Max 5 attempts
    60000 // Per minute (60000ms)
  );

  // Initialize rate limiter with monitoring integration
  const rateLimiter = createRateLimiterService();
  const originalAttempt = rateLimiter.attempt.bind(rateLimiter);
  
  rateLimiter.attempt = (userId: string, serverId: string, action: string): boolean => {
    const result = originalAttempt(userId, serverId, action);
    client.services.monitoring?.trackRateLimitAttempt(!result);
    return result;
  };
  
  client.services.rateLimiter = rateLimiter;

  client.once('ready', () => {
    logger.info(`Discord bot logged in as ${client.user?.tag}`);
  });

  client.on('error', (error) => {
    logger.error('Discord client error:', error);
  });

  return client;
}

export async function connectDiscordClient(client: DiscordClient): Promise<void> {
  try {
    await client.login(client.config.token);
  } catch (error) {
    client.services.logger?.error('Failed to connect Discord client:', error);
    throw error;
  }
}