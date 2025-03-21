import { Collection, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command, SubCommand } from '../types';
import { create } from './create';
import { list } from './list';
import { update } from './update';
import { delete_command } from './delete';

const command: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('category')
      .setDescription('Beheer categorieën voor taken')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

    // Add subcommands
    builder.addSubcommand(create.data);
    builder.addSubcommand(list.data);
    builder.addSubcommand(update.data);
    builder.addSubcommand(delete_command.data);
    
    return builder;
  })(),

  subcommands: {
    create,
    list,
    update,
    delete: delete_command
  },

  async execute(interaction, client) {
    // Get the subcommand that was used
    const subcommand = interaction.options.getSubcommand();
    
    // Get the subcommand handler
    const handler = this.subcommands?.[subcommand];
    
    if (!handler) {
      await interaction.reply({
        content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
        ephemeral: true
      });
      return;
    }

    // Execute the subcommand
    await handler.execute(interaction, client);
  }
};

export default command;