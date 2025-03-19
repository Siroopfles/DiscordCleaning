import { DiscordBot } from './services/discord/DiscordBot';
import { logger } from './services/discord/utils/logger';

async function startBot() {
  try {
    const bot = new DiscordBot();
    await bot.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Ontvangen SIGINT signaal. Bot wordt gestopt...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Ontvangen SIGTERM signaal. Bot wordt gestopt...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Fatale error bij het starten van de bot:', error);
    process.exit(1);
  }
}

startBot();