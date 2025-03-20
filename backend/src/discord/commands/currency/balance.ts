import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { currencyService } from '../../../services/currency.service';
import { SubCommand } from '../../types/discord.types';

export const balance: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('balance')
    .setDescription('Bekijk je huidige valuta saldo'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const serverId = interaction.guildId as string;
      
      const balance = await currencyService.getBalance(targetUser.id, serverId);
      const stats = await currencyService.getUserStatistics(targetUser.id, serverId);

      const rewardStats = stats.statistics.reward || { total: 0, count: 0 };
      const transferStats = stats.statistics.transfer || { total: 0, count: 0 };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`💰 Valuta Saldo: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { 
            name: 'Huidig Saldo', 
            value: `${balance.balance} credits`, 
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
        content: 'Er is een fout opgetreden bij het ophalen van het saldo.'
      });
    }
  },
};