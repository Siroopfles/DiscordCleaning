import { Collection, Client } from 'discord.js';
import { Command } from '../types/discord.types';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import { withErrorHandling } from '../utils/commandErrors';

// Recursief zoeken naar command bestanden
async function findCommandFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursief zoeken in subdirectories
        const subFiles = await findCommandFiles(fullPath);
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

// Laad een individueel command
async function loadCommand(filePath: string): Promise<Command | null> {
  try {
    const commandModule = await import(filePath);
    const command = commandModule.default;

    // Valideer command structure
    if (!command?.data || !command?.execute) {
      logger.warn('Invalid command structure', { filePath });
      return null;
    }

    // Wrap execute functie met error handling
    command.execute = withErrorHandling(command.execute);

    return command;
  } catch (error) {
    logger.error('Error loading command', { error, filePath });
    return null;
  }
}

// Hoofdfunctie voor het laden van alle commands
export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  const commandsPath = path.join(__dirname);

  try {
    // Vind alle command bestanden
    const files = await findCommandFiles(commandsPath);
    
    // Laad elk command
    for (const file of files) {
      const command = await loadCommand(file);
      
      if (command) {
        commands.set(command.data.name, command);
        logger.info('Command loaded', { name: command.data.name });
      }
    }
  } catch (error) {
    logger.error('Error in command loading process', { error });
  }

  return commands;
}