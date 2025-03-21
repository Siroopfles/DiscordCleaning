import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const update: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('update')
    .setDescription('Werk een taak bij')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('titel')
        .setDescription('Nieuwe titel voor de taak')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('beschrijving')
        .setDescription('Nieuwe beschrijving voor de taak')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Nieuwe status voor de taak')
        .setRequired(false)
        .addChoices(
          { name: 'Open', value: 'OPEN' },
          { name: 'In Uitvoering', value: 'IN_PROGRESS' },
          { name: 'Voltooid', value: 'COMPLETED' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply({ ephemeral: true });

    if (!client.services.api) {
      await interaction.editReply({
        content: 'API service is niet beschikbaar.'
      });
      return;
    }

    try {
      const taskId = interaction.options.getString('id', true);
      const titel = interaction.options.getString('titel');
      const beschrijving = interaction.options.getString('beschrijving');
      const status = interaction.options.getString('status') as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | null;

      const response = await client.services.api.updateTask(taskId, {
        title: titel || undefined,
        description: beschrijving || undefined,
        status: status || undefined
      });

      const embed = new EmbedBuilder()
        .setTitle('Taak Bijgewerkt')
        .setDescription(`Taak "${response.data?.title}" is succesvol bijgewerkt`)
        .setColor('#ffff00')
        .addFields(
          { name: 'ID', value: response.data?.id || 'Onbekend' },
          { name: 'Status', value: response.data?.status || 'Onbekend' }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      client.services.logger?.error('Error bij bijwerken taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het bijwerken van de taak.'
      });
    }
  },
};