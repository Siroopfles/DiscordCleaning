import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { DiscordClient } from '../types';

export interface SubCommand {
  data: SlashCommandSubcommandBuilder;
  execute(interaction: ChatInputCommandInteraction, client: DiscordClient): Promise<void>;
}

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction, client: DiscordClient): Promise<void>;
  subcommands?: { [key: string]: SubCommand };
}

export interface CommandHandlerOptions {
  commands: Command[];
  client: DiscordClient;
}