import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder 
} from 'discord.js';
import { Command } from '../types/discord.types';
import { logger } from '../utils/logger';
import { ApiClient } from '../api/apiClient';

const categoryCommand = new SlashCommandBuilder()
  .setName('category')
  .setDescription('Beheer categorieën')
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('Toon alle beschikbare categorieën')
  );

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const subcommand = interaction.options.getSubcommand();

  try {
    if (subcommand === 'list') {
      await handleListCategories(interaction);
    } else {
      await interaction.reply({
        content: 'Onbekend subcommando',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error bij category command:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
      ephemeral: true
    });
  }
};

async function handleListCategories(interaction: ChatInputCommandInteraction) {
  try {
    const apiClient = ApiClient.getInstance();
    const response = await apiClient.getCategories();

    if (!response.data || response.data.length === 0) {
      await interaction.reply({
        content: 'Er zijn nog geen categorieën beschikbaar.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Beschikbare Categorieën')
      .setColor('#00ff00')
      .setTimestamp();

    response.data.forEach(category => {
      embed.addFields({
        name: category.name,
        value: category.description || 'Geen beschrijving',
        inline: true
      });
    });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error bij ophalen categorieën:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het ophalen van de categorieën.',
      ephemeral: true
    });
  }
}

export default {
  data: categoryCommand,
  execute
} as Command;