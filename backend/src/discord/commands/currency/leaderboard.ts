import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { currencyService } from '../../../services/currency.service';
import { SubCommand } from '../../types/discord.types';

export const leaderboard: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('leaderboard')
    .setDescription('Bekijk de top valuta balansen in de server')
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Aantal gebruikers om te tonen (max 25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const limit = interaction.options.getInteger('limit') || 10;
      const serverId = interaction.guildId as string;
      
      const topBalances = await currencyService.getLeaderboard(serverId, limit);
      
      // Fetch usernames for all users in leaderboard
      const userPromises = topBalances.map(async (entry) => {
        try {
          const user = await interaction.client.users.fetch(entry.userId);
          return {
            ...entry,
            username: user.username
          };
        } catch {
          return {
            ...entry,
            username: 'Onbekende Gebruiker'
          };
        }
      });

      const usersWithBalances = await Promise.all(userPromises);
      
      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🏆 Valuta Leaderboard')
        .setDescription('Top balansen in deze server:')
        .setTimestamp();

      // Add leaderboard entries
      usersWithBalances.forEach((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';
        embed.addFields({
          name: `${medal} #${index + 1} ${entry.username}`,
          value: `${entry.balance} credits`
        });
      });

      // Add footer
      embed.setFooter({
        text: `Top ${usersWithBalances.length} spelers`
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Leaderboard command error:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van het leaderboard.'
      });
    }
  },
};