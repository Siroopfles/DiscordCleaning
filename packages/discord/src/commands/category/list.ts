import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const list: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Toon alle beschikbare categorieën'),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if API service is available
      if (!client.services.api) {
        throw new Error('API service is niet beschikbaar');
      }

      const response = await client.services.api.getCategories();
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Geen data ontvangen van de API');
      }

      if (response.data.length === 0) {
        await interaction.editReply({
          content: 'Er zijn nog geen categorieën aangemaakt.'
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Beschikbare Categorieën')
        .setDescription('Overzicht van alle beschikbare categorieën')
        .setTimestamp();

      // Add each category as a field
      response.data.forEach(category => {
        embed.addFields({
          name: category.name,
          value: `Kleur: ${category.color}`,
          inline: true
        });
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error bij ophalen categorieën:', error);
      
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van de categorieën.'
      });
    }
  }
};