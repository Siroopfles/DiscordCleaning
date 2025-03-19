import { Client, ChatInputCommandInteraction } from 'discord.js';
import { clientConfig, BOT_TOKEN } from './config';
import { CommandHandler } from './handlers/commandHandler';
import { logger } from './utils/logger';
import { DiscordBotClient } from './types/discord.types';

export class DiscordBot {
  private client: DiscordBotClient;
  private commandHandler: CommandHandler;

  constructor() {
    this.client = new Client(clientConfig) as DiscordBotClient;
    this.commandHandler = new CommandHandler(this.client);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Bij ready event
    this.client.on('ready', () => {
      logger.info(`Bot is online als ${this.client.user?.tag}`);
    });

    // Bij interactie (slash commands)
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      try {
        const command = this.commandHandler.getCommand(interaction.commandName);

        if (!command) {
          await interaction.reply({
            content: 'Dit commando bestaat niet!',
            ephemeral: true
          });
          return;
        }

        await command.execute(interaction);
      } catch (error) {
        logger.error('Error bij command uitvoering:', error);
        
        const errorMessage = {
          content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    });

    // Error handling
    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });
  }

  public async start(): Promise<void> {
    try {
      await this.commandHandler.loadCommands();
      await this.client.login(BOT_TOKEN);
      logger.info('Bot succesvol gestart');
    } catch (error) {
      logger.error('Fout bij het starten van de bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.client.destroy();
      logger.info('Bot succesvol gestopt');
    } catch (error) {
      logger.error('Fout bij het stoppen van de bot:', error);
      throw error;
    }
  }
}