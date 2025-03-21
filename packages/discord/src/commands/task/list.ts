import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';

export const list: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Toon alle taken'),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply();

    if (!client.services.api) {
      await interaction.editReply({
        content: 'API service is niet beschikbaar.'
      });
      return;
    }

    try {
      const response = await client.services.api.getTasks();

      if (!response.data || response.data.length === 0) {
        await interaction.editReply({
          content: 'Er zijn nog geen taken aangemaakt.',
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Taken Overzicht')
        .setColor('#0099ff')
        .setTimestamp();

      response.data.forEach(task => {
        embed.addFields({
          name: `${task.title} (${task.status})`,
          value: task.description || 'Geen beschrijving',
          inline: false
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      client.services.logger?.error('Error bij ophalen taken:', error);
      await interaction.editReply({
        content: 'Er is een fout opgetreden bij het ophalen van de taken.'
      });
    }
  },
};