import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { CategoryCreate } from '../../types/api';
import { DiscordClient } from '../../types';

interface CreateCategoryParams {
  naam: string;
  kleur: string;
}

export const create: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Maak een nieuwe categorie aan')
    .addStringOption(option =>
      option
        .setName('naam')
        .setDescription('De naam van de categorie')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(32)
    )
    .addStringOption(option =>
      option
        .setName('kleur')
        .setDescription('De kleur van de categorie (hex code, bijv: #FF0000)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const naam = interaction.options.getString('naam', true);
      const kleur = interaction.options.getString('kleur', true);

      // Validate color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(kleur)) {
        await interaction.editReply({
          content: 'De kleur moet een geldige hex code zijn (bijv: #FF0000)'
        });
        return;
      }

      // Check if API service is available
      if (!client.services.api) {
        throw new Error('API service is niet beschikbaar');
      }

      // Check if category already exists
      const categories = await client.services.api.getCategories();
      if (categories.data?.some((cat: { name: string }) => cat.name.toLowerCase() === naam.toLowerCase())) {
        await interaction.editReply({
          content: 'Er bestaat al een categorie met deze naam.'
        });
        return;
      }

      // Create category via API
      const categoryData: CategoryCreate = {
        name: naam,
        color: kleur.toUpperCase()
      };

      const response = await client.services.api.createCategory(categoryData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Geen data ontvangen van de API');
      }

      const embed = new EmbedBuilder()
        .setTitle('Categorie Aangemaakt')
        .setDescription(`Categorie "${response.data.name}" is succesvol aangemaakt`)
        .setColor(parseInt(response.data.color.replace('#', ''), 16))
        .addFields(
          { name: 'Naam', value: response.data.name },
          { name: 'Kleur', value: response.data.color }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error bij aanmaken categorie:', error);
      
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het aanmaken van de categorie.'
      });
    }
  }
};