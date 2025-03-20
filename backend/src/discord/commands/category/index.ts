import { Collection, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command, SubCommand } from '../../types/discord.types';
import { create } from './create';
import { list } from './list';
import { info } from './info';
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
    builder.addSubcommand(info.data);
    builder.addSubcommand(update.data);
    builder.addSubcommand(delete_command.data);
    
    return builder;
  })(),

  subcommands: new Collection<string, SubCommand>([
    [create.data.name, create],
    [list.data.name, list],
    [info.data.name, info],
    [update.data.name, update],
    [delete_command.data.name, delete_command]
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