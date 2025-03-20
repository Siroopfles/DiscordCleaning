import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';

export const create: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Maak een nieuwe taak aan')
    .addStringOption(option =>
      option
        .setName('titel')
        .setDescription('De titel van de taak')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('beschrijving')
        .setDescription('Een beschrijving van de taak')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('categorie')
        .setDescription('De categorie van de taak')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const titel = interaction.options.getString('titel', true);
      const beschrijving = interaction.options.getString('beschrijving');
      const categorie = interaction.options.getString('categorie');

      const apiClient = ApiClient.getInstance();
      const response = await apiClient.createTask({
        title: titel,
        description: beschrijving || undefined,
        categoryId: categorie || undefined
      });

      const embed = new EmbedBuilder()
        .setTitle('Taak Aangemaakt')
        .setDescription(`Taak "${response.data?.title}" is succesvol aangemaakt`)
        .setColor('#00ff00')
        .addFields(
          { name: 'ID', value: response.data?.id || 'Onbekend' },
          { name: 'Status', value: response.data?.status || 'OPEN' }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error bij aanmaken taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het aanmaken van de taak.'
      });
    }
  },
};