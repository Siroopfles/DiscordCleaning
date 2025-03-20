"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommandError = createCommandError;
exports.handleCommandError = handleCommandError;
exports.withErrorHandling = withErrorHandling;
exports.createValidationError = createValidationError;
exports.createPermissionError = createPermissionError;
exports.createNotFoundError = createNotFoundError;
exports.createParameterError = createParameterError;
const errors_1 = require("../../utils/errors");
const logger_1 = __importDefault(require("../../utils/logger"));
const discord_types_1 = require("../types/discord.types");
// Map van CommandErrorType naar gebruikersvriendelijke berichten
const ERROR_MESSAGES = {
    VALIDATION_ERROR: 'De opgegeven waarden zijn ongeldig.',
    EXECUTION_ERROR: 'Er is een fout opgetreden bij het uitvoeren van het commando.',
    PERMISSION_ERROR: 'Je hebt geen toestemming om dit commando uit te voeren.',
    NOT_FOUND_ERROR: 'De opgevraagde gegevens zijn niet gevonden.',
    REGISTRATION_ERROR: 'Er is een fout opgetreden bij het registreren van het commando.',
    PARAMETER_ERROR: 'De opgegeven parameter is ongeldig.'
};
// Vertaal errors naar CommandError type
function createCommandError(type, message, command, details) {
    return new discord_types_1.CommandError(type, message, command, undefined, details);
}
// Vertaal AppError types naar CommandError
function mapAppErrorToCommandError(error, commandName) {
    if (error instanceof errors_1.BadRequestError) {
        return createCommandError('VALIDATION_ERROR', error.message, commandName, error);
    }
    if (error instanceof errors_1.UnauthorizedError || error instanceof errors_1.ForbiddenError) {
        return createCommandError('PERMISSION_ERROR', error.message, commandName, error);
    }
    if (error instanceof errors_1.NotFoundError) {
        return createCommandError('NOT_FOUND_ERROR', error.message, commandName, error);
    }
    if (error instanceof errors_1.AppError) {
        return createCommandError('EXECUTION_ERROR', error.message, commandName, error);
    }
    return createCommandError('EXECUTION_ERROR', 'Er is een onverwachte fout opgetreden.', commandName, error);
}
// Handle command errors met uitgebreide logging
async function handleCommandError(interaction, error) {
    const commandError = 'type' in error ? error : mapAppErrorToCommandError(error, interaction.commandName);
    // Uitgebreide logging met command context
    logger_1.default.error('Command execution error', {
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
    const response = {
        content: ERROR_MESSAGES[commandError.type] || commandError.message,
        ephemeral: true
    };
    // Stuur error response
    if (interaction.deferred) {
        await interaction.editReply(response);
    }
    else {
        await interaction.reply(response);
    }
}
// Wrapper functie voor command execution met verbeterde error handling
function withErrorHandling(handler) {
    return async (interaction) => {
        try {
            await handler(interaction);
        }
        catch (error) {
            await handleCommandError(interaction, error);
        }
    };
}
// Utility functies voor command validatie errors
function createValidationError(message, command) {
    return createCommandError('VALIDATION_ERROR', message, command);
}
function createPermissionError(message, command) {
    return createCommandError('PERMISSION_ERROR', message, command);
}
function createNotFoundError(message, command) {
    return createCommandError('NOT_FOUND_ERROR', message, command);
}
function createParameterError(message, parameter, command) {
    return new discord_types_1.CommandError('PARAMETER_ERROR', message, command, parameter);
}
//# sourceMappingURL=commandErrors.js.map