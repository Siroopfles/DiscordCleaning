import { ChatInputCommandInteraction, Client, Collection, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface DiscordBotClient extends Client {
  commands: Collection<string, Command>;
}