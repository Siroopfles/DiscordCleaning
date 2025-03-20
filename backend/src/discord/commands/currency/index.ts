import { Collection, SlashCommandBuilder } from 'discord.js';
import { Command, SubCommand } from '../../types/discord.types';
import { balance } from './balance';
import { transfer } from './transfer';
import { history } from './history';
import { leaderboard } from './leaderboard';

const command: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('currency')
      .setDescription('Beheer je server valuta');

    // Add subcommands
    builder.addSubcommand(balance.data);
    builder.addSubcommand(transfer.data);
    builder.addSubcommand(history.data);
    builder.addSubcommand(leaderboard.data);

    return builder;
  })(),

  subcommands: new Collection<string, SubCommand>([
    [balance.data.name, balance],
    [transfer.data.name, transfer],
    [history.data.name, history],
    [leaderboard.data.name, leaderboard]
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