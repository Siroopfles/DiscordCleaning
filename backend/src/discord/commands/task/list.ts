import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';

export const list: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Toon alle taken'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const apiClient = ApiClient.getInstance();
      const response = await apiClient.getTasks();

      if (!response.data || response.data.length === 0) {
        await interaction.editReply({
          content: 'Er zijn nog geen taken aangemaakt.',
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Taken Overzicht')
        .setColor('#0099ff')
        .setTimestamp();

      response.data.forEach(task => {
        embed.addFields({
          name: `${task.title} (${task.status})`,
          value: task.description || 'Geen beschrijving',
          inline: false
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij ophalen taken:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van de taken.'
      });
    }
  },
};