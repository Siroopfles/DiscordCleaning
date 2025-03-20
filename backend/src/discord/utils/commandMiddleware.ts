import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import { BaseCommand, Command, SubCommand, ValidatedParameter } from '../types/discord.types';
import { validateParameters } from './validators';
import { validatePermissions } from './permissions';
import { handleCommandError } from './commandErrors';

// Type voor middleware functies
type CommandMiddleware = (
  command: BaseCommand,
  interaction: ChatInputCommandInteraction
) => Promise<boolean>;

// Middleware voor parameter validatie
export const validateParametersMiddleware: CommandMiddleware = async (command, interaction) => {
  if (!command.parameters || command.parameters.length === 0) {
    return true;
  }

  const parameterValues: Record<string, unknown> = {};
  
  // Verzamel alle parameter waardes uit de interactie
  for (const param of command.parameters) {
    const option = interaction.options.get(param.name);
    if (option) {
      parameterValues[param.name] = option.value;
    }
  }

  // Valideer parameters
  const validationResult = await validateParameters(command.parameters, parameterValues);
  
  if (!validationResult.isValid) {
    const firstError = validationResult.errors?.[0];
    if (firstError) {
      await handleCommandError(interaction, firstError);
    }
    return false;
  }

  // Voeg gevalideerde waardes toe aan de interaction voor gebruik in command
  (interaction as any).validatedParameters = validationResult.sanitizedValues;
  return true;
};

// Middleware voor permission checks
export const validatePermissionsMiddleware: CommandMiddleware = async (command, interaction) => {
  if (!command.permissions) {
    return true;
  }

  const permissionResult = await validatePermissions(interaction, command.permissions);
  
  if (!permissionResult.hasPermission) {
    if (permissionResult.error) {
      await handleCommandError(interaction, permissionResult.error);
    }
    return false;
  }

  return true;
};

// Generic helper type voor command types
type AnyCommand = Command | SubCommand;

// Combineer en voer alle middleware uit
export async function executeMiddleware(
  command: BaseCommand,
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  // Voer permissions check eerst uit
  if (!(await validatePermissionsMiddleware(command, interaction))) {
    return false;
  }

  // Voer parameter validatie uit
  if (!(await validateParametersMiddleware(command, interaction))) {
    return false;
  }

  return true;
}

// HOF om commands te wrappen met middleware
export function withMiddleware<T extends AnyCommand>(command: T): T {
  if (!('execute' in command)) {
    throw new Error('Command moet een execute functie hebben');
  }

  const originalExecute = command.execute;
  const isSubCommand = 'data' in command && command.data instanceof SlashCommandSubcommandBuilder;

  // Cast de command terug naar het juiste type
  const typedCommand = command as T & { execute: typeof originalExecute };

  typedCommand.execute = async (interaction: ChatInputCommandInteraction) => {
    // Voer middleware uit
    if (await executeMiddleware(command, interaction)) {
      // Als middleware succesvol is, voer originele command uit
      await originalExecute.call(command, interaction);
    }
  };

  return typedCommand;
}

// Helper functie om parameters te definiëren voor commands
export function defineParameters(parameters: ValidatedParameter[]): ValidatedParameter[] {
  return parameters;
}