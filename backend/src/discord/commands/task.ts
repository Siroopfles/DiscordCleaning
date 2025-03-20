import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder 
} from 'discord.js';
import { Command } from '../types/discord.types';
import { logger } from '../utils/logger';
import { ApiClient } from '../api/apiClient';

const taskCommand = new SlashCommandBuilder()
  .setName('task')
  .setDescription('Beheer je taken')
  .addSubcommand(subcommand =>
    subcommand
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
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('Toon alle taken')
  )
  .addSubcommand(subcommand =>
    subcommand
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
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Verwijder een taak')
      .addStringOption(option =>
        option
          .setName('id')
          .setDescription('Het ID van de taak')
          .setRequired(true)
      )
  );

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'create':
        await handleCreateTask(interaction);
        break;
      case 'list':
        await handleListTasks(interaction);
        break;
      case 'update':
        await handleUpdateTask(interaction);
        break;
      case 'delete':
        await handleDeleteTask(interaction);
        break;
      default:
        await interaction.reply({
          content: 'Onbekend subcommando',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error bij task command:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
      ephemeral: true
    });
  }
};

async function handleCreateTask(interaction: ChatInputCommandInteraction) {
  const titel = interaction.options.getString('titel', true);
  const beschrijving = interaction.options.getString('beschrijving');
  const categorie = interaction.options.getString('categorie');

  try {
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

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error bij aanmaken taak:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het aanmaken van de taak.',
      ephemeral: true
    });
  }
}

async function handleListTasks(interaction: ChatInputCommandInteraction) {
  try {
    const apiClient = ApiClient.getInstance();
    const response = await apiClient.getTasks();

    if (!response.data || response.data.length === 0) {
      await interaction.reply({
        content: 'Er zijn nog geen taken aangemaakt.',
        ephemeral: true
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

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error bij ophalen taken:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het ophalen van de taken.',
      ephemeral: true
    });
  }
}

async function handleUpdateTask(interaction: ChatInputCommandInteraction) {
  const taskId = interaction.options.getString('id', true);
  const titel = interaction.options.getString('titel');
  const beschrijving = interaction.options.getString('beschrijving');
  const status = interaction.options.getString('status') as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | null;

  try {
    const apiClient = ApiClient.getInstance();
    const response = await apiClient.updateTask(taskId, {
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

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error bij bijwerken taak:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het bijwerken van de taak.',
      ephemeral: true
    });
  }
}

async function handleDeleteTask(interaction: ChatInputCommandInteraction) {
  const taskId = interaction.options.getString('id', true);

  try {
    const apiClient = ApiClient.getInstance();
    await apiClient.deleteTask(taskId);

    await interaction.reply({
      content: `Taak met ID ${taskId} is succesvol verwijderd.`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error bij verwijderen taak:', error);
    await interaction.reply({
      content: 'Er is een fout opgetreden bij het verwijderen van de taak.',
      ephemeral: true
    });
  }
}

export default {
  data: taskCommand,
  execute
} as Command;