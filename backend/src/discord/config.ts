import dotenv from 'dotenv';
import { ClientOptions, GatewayIntentBits } from 'discord.js';

dotenv.config();

// Bot configuratie
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!BOT_TOKEN || !CLIENT_ID) {
  throw new Error('Missing required Discord configuration in environment variables');
}

// Discord.js client configuratie
export const clientConfig: ClientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
};

// Rate limiting configuratie
export const RATE_LIMIT = {
  commands: {
    windowMs: 60000, // 1 minuut
    max: 10, // max 10 commands per minuut
  },
};