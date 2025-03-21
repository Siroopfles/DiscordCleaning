import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const balance: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('balance')
    .setDescription('Bekijk je huidige valuta saldo')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('De gebruiker waarvan je het saldo wilt zien (optioneel)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply();

    try {
      // Check if API service is available
      if (!client.services.api) {
        throw new Error('API service is niet beschikbaar');
      }

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const serverId = interaction.guildId;

      if (!serverId) {
        throw new Error('Dit commando kan alleen in een server gebruikt worden');
      }
      
      // Get balance and statistics
      const [balance, stats] = await Promise.all([
        client.services.api.getBalance(targetUser.id, serverId),
        client.services.api.getUserStatistics(targetUser.id, serverId)
      ]);

      if (!balance.success || !stats.success) {
        throw new Error(balance.error || stats.error || 'Kon geen saldo ophalen');
      }

      const rewardStats = stats.data?.statistics.reward || { total: 0, count: 0 };
      const transferStats = stats.data?.statistics.transfer || { total: 0, count: 0 };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`💰 Valuta Saldo: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { 
            name: 'Huidig Saldo', 
            value: `${balance.data?.balance || 0} credits`, 
            inline: true 
          },
          { 
            name: 'Totaal Ontvangen', 
            value: `${rewardStats.total || 0} credits`, 
            inline: true 
          },
          {
            name: 'Transactie Statistieken',
            value: `Beloningen: ${rewardStats.count || 0}\nTransfers: ${transferStats.count || 0}`
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Balance command error:', error);
      await interaction.editReply({
        content: error instanceof Error ? error.message : 
          'Er is een fout opgetreden bij het ophalen van het saldo.'
      });
    }
  }
};