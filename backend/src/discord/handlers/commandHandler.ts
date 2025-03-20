import { Collection } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { Command, SubCommand, DiscordBotClient } from '../types/discord.types';
import { logger } from '../utils/logger';

export class CommandHandler {
  private client: DiscordBotClient;
  private commandsPath: string;

  constructor(client: DiscordBotClient) {
    this.client = client;
    this.client.commands = new Collection();
    this.commandsPath = path.join(__dirname, '..', 'commands');
  }

  private async loadCommandsFromDirectory(directoryPath: string): Promise<Command[]> {
    const commands: Command[] = [];
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        // Directory gevonden, recursief verwerken als mogelijke subcommands
        const parentCommand = await this.processDirectoryAsCommand(fullPath, entry.name);
        if (parentCommand) {
          commands.push(parentCommand);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        // Direct command file gevonden
        try {
          const command: Command = require(fullPath).default;
          if (this.isValidCommand(command)) {
            commands.push(command);
          }
        } catch (error) {
          logger.warn(`Error loading command file ${fullPath}:`, error);
        }
      }
    }

    return commands;
  }

  private async processDirectoryAsCommand(dirPath: string, dirName: string): Promise<Command | null> {
    // Zoek naar index.ts/js als hoofdcommand
    const indexFile = fs.readdirSync(dirPath)
      .find(file => file.startsWith('index.') && (file.endsWith('.ts') || file.endsWith('.js')));

    if (!indexFile) {
      // Geen index file gevonden, verwerk als normale subdirectory
      const subCommands = await this.loadCommandsFromDirectory(dirPath);
      return subCommands.length > 0 ? null : null;
    }

    // Laad hoofdcommand uit index file
    const indexPath = path.join(dirPath, indexFile);
    try {
      const command: Command = require(indexPath).default;
      if (!this.isValidCommand(command)) {
        return null;
      }

      // Initialiseer subcommands collection
      command.subcommands = new Collection<string, SubCommand>();

      // Laad alle andere files in de directory als subcommands
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || entry.name === indexFile || !(entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
          continue;
        }

        const subPath = path.join(dirPath, entry.name);
        try {
          const subCommand: SubCommand = require(subPath).default;
          if (this.isValidSubCommand(subCommand)) {
            command.subcommands.set(subCommand.data.name, subCommand);
            logger.info(`Loaded subcommand ${subCommand.data.name} for ${command.data.name}`);
          }
        } catch (error) {
          logger.warn(`Error loading subcommand ${subPath}:`, error);
        }
      }

      return command;
    } catch (error) {
      logger.warn(`Error loading command index ${indexPath}:`, error);
      return null;
    }
  }

  private isValidCommand(command: any): command is Command {
    return command && 'data' in command && 'execute' in command;
  }

  private isValidSubCommand(command: any): command is SubCommand {
    return command && 'data' in command && 'execute' in command;
  }

  async loadCommands(): Promise<void> {
    try {
      // Controleer of de commands directory bestaat
      if (!fs.existsSync(this.commandsPath)) {
        fs.mkdirSync(this.commandsPath, { recursive: true });
      }

      const commands = await this.loadCommandsFromDirectory(this.commandsPath);
      
      // Registreer alle commands
      for (const command of commands) {
        this.client.commands.set(command.data.name, command);
        const subCommandCount = command.subcommands?.size ?? 0;
        logger.info(
          `Loaded command: ${command.data.name}` +
          (subCommandCount > 0 ? ` with ${subCommandCount} subcommands` : '')
        );
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

  getSubCommand(command: Command, subcommandName: string): SubCommand | undefined {
    return command.subcommands?.get(subcommandName);
  }
}