import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { currencyService } from '../../../services/currency.service';
import { BadRequestError } from '../../../utils/errors';
import { SubCommand } from '../../types/discord.types';

export const transfer: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('transfer')
    .setDescription('Maak valuta over naar een andere gebruiker')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('De gebruiker die de valuta moet ontvangen')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Het aantal credits om over te maken')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Beschrijving voor de transactie')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const description = interaction.options.getString('description') || 'Valuta transfer';
      const serverId = interaction.guildId as string;

      if (!targetUser || !amount) {
        throw new BadRequestError('Ongeldige parameters voor transfer');
      }

      if (targetUser.id === interaction.user.id) {
        throw new BadRequestError('Je kunt geen valuta naar jezelf overmaken');
      }

      const result = await currencyService.transferCurrency(
        interaction.user.id,
        targetUser.id,
        serverId,
        amount,
        description
      );

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💸 Valuta Transfer Succesvol')
        .addFields(
          {
            name: 'Van',
            value: interaction.user.username,
            inline: true
          },
          {
            name: 'Naar',
            value: targetUser.username,
            inline: true
          },
          {
            name: 'Bedrag',
            value: `${amount} credits`,
            inline: true
          },
          {
            name: 'Nieuw Saldo',
            value: `${result.fromBalance.balance} credits`,
            inline: true
          },
          {
            name: 'Beschrijving',
            value: description
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Transfer command error:', error);
      
      const errorMessage = error instanceof BadRequestError
        ? error.message
        : 'Er is een fout opgetreden bij het uitvoeren van de transfer.';

      await interaction.editReply({
        content: errorMessage
      });
    }
  },
};