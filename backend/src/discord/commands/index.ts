import { Collection } from 'discord.js';
import { Command, CommandLoader, CommandRegistry, CommandError } from '../types/discord.types';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import { withErrorHandling } from '../utils/commandErrors';
import { withMiddleware } from '../utils/commandMiddleware';

// Implementatie van de CommandLoader interface
class DefaultCommandLoader implements CommandLoader {
  private async findCommandFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findCommandFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.name === 'index.ts' || entry.name === 'index.js') {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.error('Error searching for command files', { error, dir });
    }
    
    return files;
  }

  private async loadCommand(filePath: string): Promise<Command | null> {
    try {
      const commandModule = await import(filePath);
      const command = commandModule.default;

      if (await this.validateCommand(command)) {
        // Voeg middleware en error handling toe
        const processedCommand = withMiddleware(command);
        processedCommand.execute = withErrorHandling(processedCommand.execute);
        processedCommand.category = path.basename(path.dirname(filePath));
        return processedCommand;
      }
      return null;
    } catch (error) {
      logger.error('Error loading command', { error, filePath });
      return null;
    }
  }

  async validateCommand(command: Command): Promise<boolean> {
    if (!command?.data || !command?.execute) {
      logger.warn('Invalid command structure');
      return false;
    }
    return true;
  }

  async loadCommands(): Promise<Collection<string, Command>> {
    const commands = new Collection<string, Command>();
    const commandsPath = path.join(__dirname);

    try {
      const files = await this.findCommandFiles(commandsPath);
      
      for (const file of files) {
        const command = await this.loadCommand(file);
        
        if (command) {
          commands.set(command.data.name, command);
          logger.info('Command loaded', {
            name: command.data.name,
            category: command.category
          });
        }
      }
    } catch (error) {
      logger.error('Error in command loading process', { error });
    }

    return commands;
  }
}

// Implementatie van de CommandRegistry interface
class DefaultCommandRegistry implements CommandRegistry {
  commands: Collection<string, Command>;

  constructor() {
    this.commands = new Collection<string, Command>();
  }

  async registerCommand(command: Command): Promise<void> {
    try {
      if (this.commands.has(command.data.name)) {
        throw new Error(`Command ${command.data.name} already exists`);
      }
      this.commands.set(command.data.name, command);
      logger.info('Command registered', { name: command.data.name });
    } catch (error) {
      throw new CommandError(
        'REGISTRATION_ERROR',
        `Failed to register command: ${command.data.name}`,
        command.data.name,
        undefined,
        error
      );
    }
  }

  async registerCommands(commands: Command[]): Promise<void> {
    for (const command of commands) {
      await this.registerCommand(command);
    }
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getCommandsByCategory(category: string): Command[] {
    return Array.from(this.commands.values())
      .filter(command => command.category === category);
  }
}

// Exporteer de implementaties en functie voor het laden van commands
export const commandLoader = new DefaultCommandLoader();
export const commandRegistry = new DefaultCommandRegistry();

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = await commandLoader.loadCommands();
  await commandRegistry.registerCommands(Array.from(commands.values()));
  return commands;
}