import { ChatInputCommandInteraction, Client, Collection, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

// Permission types
export type PermissionLevel = 'USER' | 'MODERATOR' | 'ADMIN' | 'OWNER';

export interface Permission {
  level: PermissionLevel;
  guildId?: string;
  roleIds?: string[];
}

// Parameter validation types
export type ValidationType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE';

export interface ParameterValidation {
  type: ValidationType;
  required: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | Promise<boolean>;
}

export interface ValidatedParameter {
  name: string;
  validation: ParameterValidation;
  sanitize?: (value: unknown) => unknown;
}

// Error types voor command handling
export type CommandErrorType =
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'REGISTRATION_ERROR'
  | 'PARAMETER_ERROR';

export class CommandError extends Error {
  constructor(
    public type: CommandErrorType,
    message: string,
    public command?: string,
    public parameter?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

// Base interface voor gemeenschappelijke eigenschappen
export interface BaseCommand {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  permissions?: Permission[];
  parameters?: ValidatedParameter[];
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