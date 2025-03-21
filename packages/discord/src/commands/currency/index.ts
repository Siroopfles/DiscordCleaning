import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types';
import { balance } from './balance';
import { reward } from './reward';
import { leaderboard } from './leaderboard';

const command: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('currency')
      .setDescription('Beheer server valuta en beloningen')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

    // Add subcommands
    builder.addSubcommand(balance.data);
    builder.addSubcommand(reward.data);
    builder.addSubcommand(leaderboard.data);
    
    return builder;
  })(),

  subcommands: {
    balance,
    reward,
    leaderboard
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