"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePermissionsMiddleware = exports.validateParametersMiddleware = void 0;
exports.executeMiddleware = executeMiddleware;
exports.withMiddleware = withMiddleware;
exports.defineParameters = defineParameters;
const discord_js_1 = require("discord.js");
const validators_1 = require("./validators");
const permissions_1 = require("./permissions");
const commandErrors_1 = require("./commandErrors");
// Middleware voor parameter validatie
const validateParametersMiddleware = async (command, interaction) => {
    var _a;
    if (!command.parameters || command.parameters.length === 0) {
        return true;
    }
    const parameterValues = {};
    // Verzamel alle parameter waardes uit de interactie
    for (const param of command.parameters) {
        const option = interaction.options.get(param.name);
        if (option) {
            parameterValues[param.name] = option.value;
        }
    }
    // Valideer parameters
    const validationResult = await (0, validators_1.validateParameters)(command.parameters, parameterValues);
    if (!validationResult.isValid) {
        const firstError = (_a = validationResult.errors) === null || _a === void 0 ? void 0 : _a[0];
        if (firstError) {
            await (0, commandErrors_1.handleCommandError)(interaction, firstError);
        }
        return false;
    }
    // Voeg gevalideerde waardes toe aan de interaction voor gebruik in command
    interaction.validatedParameters = validationResult.sanitizedValues;
    return true;
};
exports.validateParametersMiddleware = validateParametersMiddleware;
// Middleware voor permission checks
const validatePermissionsMiddleware = async (command, interaction) => {
    if (!command.permissions) {
        return true;
    }
    const permissionResult = await (0, permissions_1.validatePermissions)(interaction, command.permissions);
    if (!permissionResult.hasPermission) {
        if (permissionResult.error) {
            await (0, commandErrors_1.handleCommandError)(interaction, permissionResult.error);
        }
        return false;
    }
    return true;
};
exports.validatePermissionsMiddleware = validatePermissionsMiddleware;
// Combineer en voer alle middleware uit
async function executeMiddleware(command, interaction) {
    // Voer permissions check eerst uit
    if (!(await (0, exports.validatePermissionsMiddleware)(command, interaction))) {
        return false;
    }
    // Voer parameter validatie uit
    if (!(await (0, exports.validateParametersMiddleware)(command, interaction))) {
        return false;
    }
    return true;
}
// HOF om commands te wrappen met middleware
function withMiddleware(command) {
    if (!('execute' in command)) {
        throw new Error('Command moet een execute functie hebben');
    }
    const originalExecute = command.execute;
    const isSubCommand = 'data' in command && command.data instanceof discord_js_1.SlashCommandSubcommandBuilder;
    // Cast de command terug naar het juiste type
    const typedCommand = command;
    typedCommand.execute = async (interaction) => {
        // Voer middleware uit
        if (await executeMiddleware(command, interaction)) {
            // Als middleware succesvol is, voer originele command uit
            await originalExecute.call(command, interaction);
        }
    };
    return typedCommand;
}
// Helper functie om parameters te definiëren voor commands
function defineParameters(parameters) {
    return parameters;
}
//# sourceMappingURL=commandMiddleware.js.map