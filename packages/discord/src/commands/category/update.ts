import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { CategoryCreate } from '../../types/api';
import { DiscordClient } from '../../types';

export const update: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('update')
    .setDescription('Werk een bestaande categorie bij')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de categorie')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('naam')
        .setDescription('De nieuwe naam van de categorie')
        .setMinLength(3)
        .setMaxLength(32)
    )
    .addStringOption(option =>
      option
        .setName('kleur')
        .setDescription('De nieuwe kleur van de categorie (hex code, bijv: #FF0000)')
    ),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if API service is available
      if (!client.services.api) {
        throw new Error('API service is niet beschikbaar');
      }

      const categoryId = interaction.options.getString('id', true);
      const newName = interaction.options.getString('naam');
      const newColor = interaction.options.getString('kleur');

      // Check if at least one field is being updated
      if (!newName && !newColor) {
        await interaction.editReply({
          content: 'Je moet minimaal een nieuwe naam of kleur opgeven.'
        });
        return;
      }

      // Validate color if provided
      if (newColor && !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
        await interaction.editReply({
          content: 'De kleur moet een geldige hex code zijn (bijv: #FF0000)'
        });
        return;
      }

      // Get current category to validate it exists
      const currentCategory = await client.services.api.getCategory(categoryId);
      if (!currentCategory.success || !currentCategory.data) {
        throw new Error('Categorie niet gevonden');
      }

      // Check if new name is unique if changing name
      if (newName) {
        const categories = await client.services.api.getCategories();
        if (categories.data?.some(cat => 
          cat.id !== categoryId && 
          cat.name.toLowerCase() === newName.toLowerCase()
        )) {
          await interaction.editReply({
            content: 'Er bestaat al een andere categorie met deze naam.'
          });
          return;
        }
      }

      // Prepare update data
      const updateData: CategoryCreate = {
        name: newName || currentCategory.data.name,
        color: (newColor || currentCategory.data.color).toUpperCase()
      };

      // Update category
      const response = await client.services.api.updateCategory(categoryId, updateData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Geen data ontvangen van de API');
      }

      const embed = new EmbedBuilder()
        .setTitle('Categorie Bijgewerkt')
        .setDescription(`Categorie "${response.data.name}" is succesvol bijgewerkt`)
        .setColor(parseInt(response.data.color.replace('#', ''), 16))
        .addFields(
          { name: 'Naam', value: response.data.name },
          { name: 'Kleur', value: response.data.color }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error bij bijwerken categorie:', error);
      
      const errorMessage = error instanceof Error ? error.message : 
        'Er is een fout opgetreden bij het bijwerken van de categorie.';
      
      await interaction.editReply({
        content: errorMessage
      });
    }
  }
};