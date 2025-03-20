import { Collection, SlashCommandBuilder } from 'discord.js';
import { Command, SubCommand } from '../../types/discord.types';
import { create } from './create';
import { list } from './list';
import { delete_command } from './delete';
import { update } from './update';
import { assign } from './assign';
import { complete } from './complete';

const command: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('task')
      .setDescription('Beheer taken en projecten');

    // Add subcommands
    builder.addSubcommand(create.data);
    builder.addSubcommand(list.data);
    builder.addSubcommand(delete_command.data);
    builder.addSubcommand(update.data);
    builder.addSubcommand(assign.data);
    builder.addSubcommand(complete.data);
    
    return builder;
  })(),

  subcommands: new Collection<string, SubCommand>([
    [create.data.name, create],
    [list.data.name, list],
    [delete_command.data.name, delete_command],
    [update.data.name, update],
    [assign.data.name, assign],
    [complete.data.name, complete]
  ]),

  async execute(interaction) {
    // Get the subcommand that was used
    const subcommand = interaction.options.getSubcommand();
    
    // Get the subcommand handler from our collection
    const handler = command.subcommands?.get(subcommand);
    
    if (!handler) {
      await interaction.reply({
        content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
        ephemeral: true
      });
      return;
    }

    // Execute the subcommand
    await handler.execute(interaction);
  }
};

export default command;