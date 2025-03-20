import { ChatInputCommandInteraction, Client, Collection, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

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
}

export interface DiscordBotClient extends Client {
  commands: Collection<string, Command>;
}