import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const delete_command: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('delete')
    .setDescription('Verwijder een taak')
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
      await client.services.api.deleteTask(taskId);

      await interaction.editReply({
        content: `Taak met ID ${taskId} is succesvol verwijderd.`
      });
    } catch (error) {
      client.services.logger?.error('Error bij verwijderen taak:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het verwijderen van de taak.'
      });
    }
  },
};

// Export as 'delete' for consistency with index.ts
export const delete_ = delete_command;