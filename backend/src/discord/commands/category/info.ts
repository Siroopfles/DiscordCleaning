import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';
import { CategoryInfo } from '../../../types/models';

export const info: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('info')
    .setDescription('Toon gedetailleerde informatie over een categorie')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de categorie')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      if (!interaction.memberPermissions?.has('ManageChannels')) {
        await interaction.editReply({
          content: 'Je hebt geen toestemming om categorie informatie te bekijken.'
        });
        return;
      }

      const categoryId = interaction.options.getString('id', true);
      const apiClient = ApiClient.getInstance();
      const response = await apiClient.getCategory(categoryId);

      if (!response.data) {
        await interaction.editReply({
          content: 'Deze categorie bestaat niet.'
        });
        return;
      }

      const category: CategoryInfo = response.data;
      
      const embed = new EmbedBuilder()
        .setTitle(`Categorie: ${category.name}`)
        .setColor(parseInt(category.color.replace('#', ''), 16))
        .addFields(
          { name: 'ID', value: category.id, inline: true },
          { name: 'Naam', value: category.name, inline: true },
          { name: 'Kleur', value: category.color, inline: true },
          { name: 'Taken', value: `${category.task_count || 0}`, inline: true },
          {
            name: 'Status Verdeling',
            value: category.task_stats ?
              `✅ Voltooid: ${category.task_stats.completed}\n⏳ In Behandeling: ${category.task_stats.in_progress}\n❌ Open: ${category.task_stats.open}` :
              'Geen taken beschikbaar',
            inline: false
          }
        )
        .setTimestamp();

      if (category.created_at) {
        embed.addFields({
          name: 'Aangemaakt op',
          value: new Date(category.created_at).toLocaleString('nl-NL'),
          inline: true
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij ophalen categorie informatie:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van de categorie informatie.'
      });
    }
  },
};