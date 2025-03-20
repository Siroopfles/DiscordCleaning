import { ChatInputCommandInteraction, Client, Collection, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

// Error types voor command handling
export type CommandErrorType =
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'REGISTRATION_ERROR';

export interface CommandError {
  type: CommandErrorType;
  message: string;
  command?: string;
  details?: unknown;
}

// Base interface voor gemeenschappelijke eigenschappen
export interface BaseCommand {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Interface voor subcommands
export interface SubCommand extends BaseCommand {
  data: SlashCommandSubcommandBuilder;
}

// Hoofdcommand interface met subcommand support
export interface Command extends BaseCommand {
  data: SlashCommandBuilder;
  subcommands?: Collection<string, SubCommand>;
  category?: string;
}

// Command loader interface
export interface CommandLoader {
  loadCommands(): Promise<Collection<string, Command>>;
  validateCommand(command: Command): Promise<boolean>;
}

// Command registry interface
export interface CommandRegistry {
  commands: Collection<string, Command>;
  registerCommand(command: Command): Promise<void>;
  registerCommands(commands: Command[]): Promise<void>;
  getCommand(name: string): Command | undefined;
  getCommandsByCategory(category: string): Command[];
}

export interface DiscordBotClient extends Client {
  commands: Collection<string, Command>;
  commandRegistry?: CommandRegistry;
}