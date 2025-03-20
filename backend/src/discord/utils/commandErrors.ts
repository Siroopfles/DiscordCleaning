import { ChatInputCommandInteraction } from 'discord.js';
import { AppError, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import logger from '../../utils/logger';
import { CommandError, CommandErrorType } from '../types/discord.types';

interface ErrorResponse {
  content: string;
  ephemeral: boolean;
}

// Map van CommandErrorType naar gebruikersvriendelijke berichten
const ERROR_MESSAGES: Record<CommandErrorType, string> = {
  VALIDATION_ERROR: 'De opgegeven waarden zijn ongeldig.',
  EXECUTION_ERROR: 'Er is een fout opgetreden bij het uitvoeren van het commando.',
  PERMISSION_ERROR: 'Je hebt geen toestemming om dit commando uit te voeren.',
  NOT_FOUND_ERROR: 'De opgevraagde gegevens zijn niet gevonden.',
  REGISTRATION_ERROR: 'Er is een fout opgetreden bij het registreren van het commando.',
  PARAMETER_ERROR: 'De opgegeven parameter is ongeldig.'
};

// Vertaal errors naar CommandError type
export function createCommandError(
  type: CommandErrorType,
  message: string,
  command?: string,
  details?: unknown
): CommandError {
  return new CommandError(type, message, command, undefined, details);
}

// Vertaal AppError types naar CommandError
function mapAppErrorToCommandError(error: Error, commandName?: string): CommandError {
  if (error instanceof BadRequestError) {
    return createCommandError('VALIDATION_ERROR', error.message, commandName, error);
  }
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
    return createCommandError('PERMISSION_ERROR', error.message, commandName, error);
  }
  if (error instanceof NotFoundError) {
    return createCommandError('NOT_FOUND_ERROR', error.message, commandName, error);
  }
  if (error instanceof AppError) {
    return createCommandError('EXECUTION_ERROR', error.message, commandName, error);
  }
  return createCommandError('EXECUTION_ERROR', 'Er is een onverwachte fout opgetreden.', commandName, error);
}

// Handle command errors met uitgebreide logging
export async function handleCommandError(
  interaction: ChatInputCommandInteraction,
  error: Error | CommandError
): Promise<void> {
  const commandError = 'type' in error ? error : mapAppErrorToCommandError(error, interaction.commandName);

  // Uitgebreide logging met command context
  logger.error('Command execution error', {
    commandName: interaction.commandName,
    commandType: commandError.type,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    error: {
      type: commandError.type,
      message: commandError.message,
      details: commandError.details,
      stack: error instanceof Error ? error.stack : undefined
    }
  });

  // Bereid error response voor
  const response: ErrorResponse = {
    content: ERROR_MESSAGES[commandError.type] || commandError.message,
    ephemeral: true
  };

  // Stuur error response
  if (interaction.deferred) {
    await interaction.editReply(response);
  } else {
    await interaction.reply(response);
  }
}

// Wrapper functie voor command execution met verbeterde error handling
export function withErrorHandling(
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>
): (interaction: ChatInputCommandInteraction) => Promise<void> {
  return async (interaction: ChatInputCommandInteraction): Promise<void> => {
    try {
      await handler(interaction);
    } catch (error) {
      await handleCommandError(interaction, error as Error | CommandError);
    }
  };
}

// Utility functies voor command validatie errors
export function createValidationError(message: string, command?: string): CommandError {
  return createCommandError('VALIDATION_ERROR', message, command);
}

export function createPermissionError(message: string, command?: string): CommandError {
  return createCommandError('PERMISSION_ERROR', message, command);
}

export function createNotFoundError(message: string, command?: string): CommandError {
  return createCommandError('NOT_FOUND_ERROR', message, command);
}

export function createParameterError(message: string, parameter: string, command?: string): CommandError {
  return new CommandError('PARAMETER_ERROR', message, command, parameter);
}