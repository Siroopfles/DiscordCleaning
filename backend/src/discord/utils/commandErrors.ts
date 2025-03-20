import { ChatInputCommandInteraction } from 'discord.js';
import { AppError, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import logger from '../../utils/logger';

interface ErrorResponse {
  content: string;
  ephemeral: boolean;
}

// Vertaal AppError types naar gebruikersvriendelijke berichten
function getErrorMessage(error: Error): string {
  if (error instanceof BadRequestError) {
    return 'De opgegeven waarden zijn ongeldig.';
  }
  if (error instanceof UnauthorizedError) {
    return 'Je moet ingelogd zijn om dit commando te gebruiken.';
  }
  if (error instanceof ForbiddenError) {
    return 'Je hebt geen toestemming om dit commando uit te voeren.';
  }
  if (error instanceof NotFoundError) {
    return 'De opgevraagde gegevens zijn niet gevonden.';
  }
  if (error instanceof AppError) {
    return error.message;
  }
  return 'Er is een onverwachte fout opgetreden bij het uitvoeren van dit commando.';
}

// Handle command errors met logging
export async function handleCommandError(
  interaction: ChatInputCommandInteraction,
  error: Error
): Promise<void> {
  // Log error details
  logger.error('Command execution error', {
    commandName: interaction.commandName,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error instanceof AppError ? error.statusCode : 500
    }
  });

  // Bereid error response voor
  const response: ErrorResponse = {
    content: getErrorMessage(error),
    ephemeral: true
  };

  // Stuur error response
  if (interaction.deferred) {
    await interaction.editReply(response);
  } else {
    await interaction.reply(response);
  }
}

// Wrapper functie voor command execution met error handling
export function withErrorHandling(
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>
): (interaction: ChatInputCommandInteraction) => Promise<void> {
  return async (interaction: ChatInputCommandInteraction): Promise<void> => {
    try {
      await handler(interaction);
    } catch (error) {
      await handleCommandError(interaction, error as Error);
    }
  };
}