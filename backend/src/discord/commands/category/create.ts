import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';

export const create: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Maak een nieuwe categorie aan')
    .addStringOption(option =>
      option
        .setName('naam')
        .setDescription('De naam van de categorie')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('kleur')
        .setDescription('De kleur van de categorie (hex code, bijv: #FF0000)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const naam = interaction.options.getString('naam', true);
      const kleur = interaction.options.getString('kleur', true);

      // Validate color format
      if (!kleur.match(/^#[0-9A-Fa-f]{6}$/)) {
        await interaction.editReply({
          content: 'De kleur moet een geldige hex code zijn (bijv: #FF0000)'
        });
        return;
      }

      const apiClient = ApiClient.getInstance();
      const response = await apiClient.createCategory({
        name: naam,
        color: kleur
      });

      const embed = new EmbedBuilder()
        .setTitle('Categorie Aangemaakt')
        .setDescription(`Categorie "${response.data?.name}" is succesvol aangemaakt`)
        .setColor(parseInt(kleur.replace('#', ''), 16))
        .addFields(
          { name: 'Naam', value: response.data?.name || 'Onbekend' },
          { name: 'Kleur', value: response.data?.color || kleur }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij aanmaken categorie:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het aanmaken van de categorie.'
      });
    }
  },
};