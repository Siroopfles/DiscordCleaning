import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';

export const complete: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('complete')
    .setDescription('Markeer een taak als voltooid')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const taskId = interaction.options.getString('id', true);

      const apiClient = ApiClient.getInstance();
      const response = await apiClient.updateTask(taskId, {
        status: 'COMPLETED'
      });

      const embed = new EmbedBuilder()
        .setTitle('Taak Voltooid')
        .setDescription(`Taak "${response.data?.title}" is gemarkeerd als voltooid`)
        .setColor('#00ff00')
        .addFields(
          { name: 'ID', value: response.data?.id || 'Onbekend' },
          { name: 'Status', value: response.data?.status || 'COMPLETED' }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij voltooien taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het voltooien van de taak.'
      });
    }
  },
};