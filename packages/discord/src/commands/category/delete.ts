import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const delete_command: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('delete')
    .setDescription('Verwijder een categorie')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de categorie')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if API service is available
      if (!client.services.api) {
        throw new Error('API service is niet beschikbaar');
      }

      const categoryId = interaction.options.getString('id', true);

      // Get current category to show info in confirmation
      const category = await client.services.api.getCategory(categoryId);
      if (!category.success || !category.data) {
        throw new Error('Categorie niet gevonden');
      }

      // Delete the category
      const response = await client.services.api.deleteCategory(categoryId);
      
      if (!response.success) {
        throw new Error(response.error || 'Fout bij verwijderen categorie');
      }

      const embed = new EmbedBuilder()
        .setTitle('Categorie Verwijderd')
        .setDescription(`Categorie "${category.data.name}" is succesvol verwijderd`)
        .setColor(parseInt(category.data.color.replace('#', ''), 16))
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error bij verwijderen categorie:', error);
      
      const errorMessage = error instanceof Error ? error.message : 
        'Er is een fout opgetreden bij het verwijderen van de categorie.';
      
      await interaction.editReply({
        content: errorMessage
      });
    }
  }
};