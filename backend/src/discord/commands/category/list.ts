import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';
import { CategoryInfo } from '../../../types/models';

export const list: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Toon alle categorieën')
    .addIntegerOption(option =>
      option
        .setName('pagina')
        .setDescription('Paginanummer (25 categorieën per pagina)')
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      if (!interaction.memberPermissions?.has('ManageChannels')) {
        await interaction.editReply({
          content: 'Je hebt geen toestemming om categorieën te bekijken.'
        });
        return;
      }

      const page = interaction.options.getInteger('pagina') || 1;
      const pageSize = 25;

      const apiClient = ApiClient.getInstance();
      const response = await apiClient.getCategories();

      if (!response.data || response.data.length === 0) {
        await interaction.editReply({
          content: 'Er zijn nog geen categorieën aangemaakt.'
        });
        return;
      }

      // Client-side pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const totalPages = Math.ceil(response.data.length / pageSize);
      
      // Validate page number
      if (page > totalPages) {
        await interaction.editReply({
          content: `Ongeldige pagina. Er ${totalPages === 1 ? 'is' : 'zijn'} maar ${totalPages} pagina${totalPages === 1 ? '' : 's'}.`
        });
        return;
      }

      const paginatedCategories = response.data.slice(startIndex, endIndex);

      const embed = new EmbedBuilder()
        .setTitle('Categorieën Overzicht')
        .setDescription(`Pagina ${page} van ${totalPages}`)
        .setTimestamp();

      paginatedCategories.forEach((category: CategoryInfo) => {
        embed.addFields({
          name: category.name,
          value: `Kleur: ${category.color}\nAantal taken: ${category.task_count}`,
          inline: true
        });
      });

      // Set embed color to first category color or default
      if (paginatedCategories.length > 0) {
        const firstCategoryColor = paginatedCategories[0].color;
        embed.setColor(parseInt(firstCategoryColor.replace('#', ''), 16));
      } else {
        embed.setColor('#0099ff');
      }

      // Add pagination info in footer
      embed.setFooter({
        text: `Totaal aantal categorieën: ${response.data.length} | Gebruik /category list pagina:[nummer] voor meer resultaten`
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij ophalen categorieën:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van de categorieën.'
      });
    }
  },
};