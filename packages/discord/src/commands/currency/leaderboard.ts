import { 
  SlashCommandSubcommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder
} from 'discord.js';
import { SubCommand } from '../types';
import type { DiscordClient } from '../../types';
import { CurrencyBalance } from '../../types/api';

// Aanmaken van de subcommand builder
const createSubcommand = () => {
  const subcommand = new SlashCommandSubcommandBuilder()
    .setName('leaderboard')
    .setDescription('Bekijk de server valuta ranglijst')
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Aantal gebruikers om te tonen (max 25)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('sort')
        .setDescription('Sortering van de ranglijst')
        .setRequired(false)
        .addChoices(
          { name: 'Meeste valuta', value: 'highest' },
          { name: 'Minste valuta', value: 'lowest' }
        )
    );
    
  return subcommand;
};

export const leaderboard: SubCommand = {
  data: createSubcommand(),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply();
    
    try {
      // Check if required services are available
      if (!client.services.api || !client.services.monitoring) {
        throw new Error('Vereiste services zijn niet beschikbaar');
      }

      const serverId = interaction.guildId!;
      const limit = interaction.options.get('limit')?.value as number || 10;
      const sort = interaction.options.get('sort')?.value as string || 'highest';

      client.services.monitoring.trackCurrencyOperation('LEADERBOARD_VIEW', false);
      let leaderboardData = await client.services.api.getLeaderboard(serverId, limit);

      if (!leaderboardData.success || !leaderboardData.data) {
        throw new Error('Kon de leaderboard data niet ophalen');
      }

      // Track successful operation
      client.services.monitoring.trackCurrencyOperation('LEADERBOARD_VIEW', true);

      let entries = leaderboardData.data;
      
      // Sorteer de data
      entries = entries.sort((a, b) => {
        return sort === 'highest' ? b.balance - a.balance : a.balance - b.balance;
      });

      // Maak de leaderboard embed
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Server Valuta Ranglijst')
        .setDescription('Top valuta bezitters in deze server')
        .setTimestamp();

      // Voeg leaderboard entries toe
      const leaderboardText = await Promise.all(entries.map(async (entry: CurrencyBalance, index: number) => {
        const user = await client.users.fetch(entry.userId);
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
        return `${medal} **#${index + 1}** ${user.username}: ${entry.balance} 💰`;
      }));

      embed.addFields({
        name: '\u200b',
        value: leaderboardText.join('\n')
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      // Track failed operation if not already tracked
      if (error instanceof Error && !error.message.includes('services zijn niet beschikbaar')) {
        client.services.monitoring?.trackCurrencyOperation('LEADERBOARD_VIEW', false);
      }

      const errorMessage = error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden';
      
      await interaction.editReply({
        content: `❌ ${errorMessage}`,
        embeds: []
      });

      // Log metrics report when errors occur
      client.services.monitoring?.logMetricsReport();
    }
  }
};