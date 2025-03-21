import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const complete: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('complete')
    .setDescription('Markeer een taak als voltooid')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true)
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

      const response = await client.services.api.updateTask(taskId, {
        status: 'COMPLETED'
      });

      const embed = new EmbedBuilder()
        .setTitle('Taak Voltooid')
        .setDescription(`Taak "${response.data?.title}" is gemarkeerd als voltooid`)
        .setColor('#00ff00')
        .addFields(
          { name: 'ID', value: response.data?.id || 'Onbekend' },
          { name: 'Status', value: response.data?.status || 'COMPLETED' }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      client.services.logger?.error('Error bij voltooien taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het voltooien van de taak.'
      });
    }
  },
};