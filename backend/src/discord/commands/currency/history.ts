import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { currencyService } from '../../../services/currency.service';
import { SubCommand } from '../../types/discord.types';

export const history: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('history')
    .setDescription('Bekijk je valuta transactie geschiedenis')
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('Paginanummer (start bij 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Optioneel: bekijk de geschiedenis van een andere gebruiker')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const page = interaction.options.getInteger('page') || 1;
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const serverId = interaction.guildId as string;
      
      const { transactions, hasMore } = await currencyService.getTransactionHistory(
        targetUser.id,
        serverId,
        page,
        5 // Aantal transacties per pagina
      );

      if (transactions.length === 0) {
        await interaction.editReply({
          content: `${targetUser.username} heeft nog geen transacties.`
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle(`💳 Transactie Geschiedenis: ${targetUser.username}`)
        .setDescription('Recente transacties:')
        .setTimestamp();

      // Add transaction entries
      for (const tx of transactions) {
        const amount = tx.amount;
        const sign = amount >= 0 ? '+' : '';
        const emoji = amount >= 0 ? '📈' : '📉';
        
        let description = tx.description;
        if (tx.type === 'TRANSFER' && tx.relatedUserId) {
          try {
            const relatedUser = await interaction.client.users.fetch(tx.relatedUserId);
            const direction = amount >= 0 ? 'van' : 'naar';
            description += ` ${direction} ${relatedUser.username}`;
          } catch {
            description += ` ${amount >= 0 ? 'van' : 'naar'} Onbekende Gebruiker`;
          }
        }

        embed.addFields({
          name: `${emoji} ${tx.type}`,
          value: `${sign}${amount} credits\n${description}\n${new Date(tx.timestamp).toLocaleString('nl-NL')}`
        });
      }

      // Add pagination footer
      embed.setFooter({
        text: `Pagina ${page}${hasMore ? ' • Gebruik /currency history [pagina] voor meer' : ''}`
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('History command error:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van de transactie geschiedenis.'
      });
    }
  },
};