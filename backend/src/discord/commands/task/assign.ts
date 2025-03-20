import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';

export const assign: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('assign')
    .setDescription('Wijs een taak toe aan een gebruiker')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('gebruiker')
        .setDescription('De gebruiker aan wie de taak wordt toegewezen')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const taskId = interaction.options.getString('id', true);
      const assignee = interaction.options.getUser('gebruiker', true);

      const apiClient = ApiClient.getInstance();
      const response = await apiClient.updateTask(taskId, {
        assigned_to: assignee.id
      });

      const embed = new EmbedBuilder()
        .setTitle('Taak Toegewezen')
        .setDescription(`Taak "${response.data?.title}" is toegewezen aan ${assignee.username}`)
        .setColor('#00ff00')
        .addFields(
          { name: 'ID', value: response.data?.id || 'Onbekend' },
          { name: 'Status', value: response.data?.status || 'Onbekend' },
          { name: 'Toegewezen aan', value: assignee.username }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij toewijzen taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het toewijzen van de taak.'
      });
    }
  },
};