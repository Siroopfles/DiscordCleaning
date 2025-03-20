import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand, ValidatedParameter, CommandError } from '../../types/discord.types';
import { logger } from '../../utils/logger';
import { ApiClient } from '../../api/apiClient';
import { defineParameters, withMiddleware } from '../../utils/commandMiddleware';
import { createCommandError } from '../../utils/commandErrors';
import { DEFAULT_PERMISSIONS } from '../../utils/permissions';

// Interface voor type-safe parameters
interface CreateCategoryParams {
  naam: string;
  kleur: string;
}

// Parameters definitie met validatie regels
const parameters = defineParameters([
  {
    name: 'naam',
    validation: {
      type: 'STRING',
      required: true,
      min: 3,
      max: 32,
      pattern: /^[\w\s-]+$/,
      custom: async (value) => {
        // Extra validatie: Check of naam al bestaat
        const apiClient = ApiClient.getInstance();
        const categories = await apiClient.getCategories();
        return !categories.data?.some(cat =>
          cat.name.toLowerCase() === (value as string).toLowerCase()
        );
      }
    }
  },
  {
    name: 'kleur',
    validation: {
      type: 'STRING',
      required: true,
      pattern: /^#[0-9A-Fa-f]{6}$/,
      custom: (value) => typeof value === 'string' && value.startsWith('#')
    },
    sanitize: (value) => String(value).toUpperCase()
  }
]);

export const create: SubCommand = withMiddleware({
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

  // Voeg parameter validatie en permissions toe
  parameters,
  permissions: DEFAULT_PERMISSIONS.MODERATORS_ONLY,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Type-safe parameter extractie
      const validatedParams = (interaction as any).validatedParameters as CreateCategoryParams;
      const { naam, kleur } = validatedParams;

      const apiClient = ApiClient.getInstance();
      
      try {
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
        // API error handling
        if (error instanceof Error) {
          logger.error('API Error bij aanmaken categorie:', error);
          throw createCommandError(
            'EXECUTION_ERROR',
            'Er is een fout opgetreden bij het aanmaken van de categorie in de database.'
          );
        }
        throw error;
      }
    } catch (error) {
      // Centrale error handling
      logger.error('Error bij aanmaken categorie:', error);
      
      const errorMessage = error instanceof CommandError
        ? error.message
        : 'Er is een onverwachte fout opgetreden bij het aanmaken van de categorie.';
      
      await interaction.editReply({
        content: errorMessage
      });
    }
  }
});