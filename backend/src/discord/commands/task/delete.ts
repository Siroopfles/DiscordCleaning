import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';

export const delete_command: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('delete')
    .setDescription('Verwijder een taak')
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
      
      await apiClient.deleteTask(taskId);

      await interaction.editReply({
        content: `Taak met ID ${taskId} is succesvol verwijderd.`
      });
    } catch (error) {
      logger.error('Error bij verwijderen taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het verwijderen van de taak.'
      });
    }
  },
};