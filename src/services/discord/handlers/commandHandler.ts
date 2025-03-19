import { Collection } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { Command, DiscordBotClient } from '../types/discord.types';
import { logger } from '../utils/logger';

export class CommandHandler {
  private client: DiscordBotClient;
  private commandsPath: string;

  constructor(client: DiscordBotClient) {
    this.client = client;
    this.client.commands = new Collection();
    this.commandsPath = path.join(__dirname, '..', 'commands');
  }

  async loadCommands(): Promise<void> {
    try {
      // Controleer of de commands directory bestaat
      if (!fs.existsSync(this.commandsPath)) {
        fs.mkdirSync(this.commandsPath, { recursive: true });
      }

      const commandFiles = fs
        .readdirSync(this.commandsPath)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(this.commandsPath, file);
        const command: Command = require(filePath).default;

        if ('data' in command && 'execute' in command) {
          this.client.commands.set(command.data.name, command);
          logger.info(`Loaded command: ${command.data.name}`);
        } else {
          logger.warn(`Invalid command file: ${file}`);
        }
      }

      logger.info(`Loaded ${this.client.commands.size} commands successfully`);
    } catch (error) {
      logger.error('Error loading commands:', error);
      throw error;
    }
  }

  getCommand(name: string): Command | undefined {
    return this.client.commands.get(name);
  }
}