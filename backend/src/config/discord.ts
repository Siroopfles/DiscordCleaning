import logger from '../utils/logger';

// Controleer of vereiste environment variables zijn ingesteld
const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error('Missing required Discord environment variables');
}

export const discordConfig = {
  config: {
    token,
    clientId,
    guildId
  },
  services: {
    logger
  }
};