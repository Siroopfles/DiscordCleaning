import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import { Command } from '../types';
import { create } from './create';
import { list } from './list';
import { update } from './update';
import { delete_ } from './delete';
import { assign } from './assign';
import { complete } from './complete';

const taskCommand = new SlashCommandBuilder()
  .setName('task')
  .setDescription('Beheer taken');

// Cast to subcommands-only builder and add subcommands
const data = taskCommand as SlashCommandSubcommandsOnlyBuilder;
data
  .addSubcommand(create.data)
  .addSubcommand(list.data)
  .addSubcommand(update.data)
  .addSubcommand(delete_.data)
  .addSubcommand(assign.data)
  .addSubcommand(complete.data);

export const task: Command = {
  data: taskCommand,

  subcommands: {
    create,
    list,
    update,
    delete: delete_,
    assign,
    complete
  },

  async execute(interaction, client) {
    // This should never be called directly since we're using subcommands
    await interaction.reply({
      content: 'Gebruik een subcommando om taken te beheren.',
      ephemeral: true
    });
  }
};

export * from './create';
export * from './list';
export * from './update';
export * from './delete';
export * from './assign';
export * from './complete';

export default task;