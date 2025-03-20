"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const discord_js_1 = require("discord.js");
const discord_types_1 = require("../../types/discord.types");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
const commandMiddleware_1 = require("../../utils/commandMiddleware");
const commandErrors_1 = require("../../utils/commandErrors");
const permissions_1 = require("../../utils/permissions");
// Parameters definitie met validatie regels
const parameters = (0, commandMiddleware_1.defineParameters)([
    {
        name: 'naam',
        validation: {
            type: 'STRING',
            required: true,
            min: 3,
            max: 32,
            pattern: /^[\w\s-]+$/,
            custom: async (value) => {
                var _a;
                // Extra validatie: Check of naam al bestaat
                const apiClient = apiClient_1.ApiClient.getInstance();
                const categories = await apiClient.getCategories();
                return !((_a = categories.data) === null || _a === void 0 ? void 0 : _a.some(cat => cat.name.toLowerCase() === value.toLowerCase()));
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
exports.create = (0, commandMiddleware_1.withMiddleware)({
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('create')
        .setDescription('Maak een nieuwe categorie aan')
        .addStringOption(option => option
        .setName('naam')
        .setDescription('De naam van de categorie')
        .setRequired(true))
        .addStringOption(option => option
        .setName('kleur')
        .setDescription('De kleur van de categorie (hex code, bijv: #FF0000)')
        .setRequired(true)),
    // Voeg parameter validatie en permissions toe
    parameters,
    permissions: permissions_1.DEFAULT_PERMISSIONS.MODERATORS_ONLY,
    async execute(interaction) {
        var _a, _b, _c;
        await interaction.deferReply({ ephemeral: true });
        try {
            // Type-safe parameter extractie
            const validatedParams = interaction.validatedParameters;
            const { naam, kleur } = validatedParams;
            const apiClient = apiClient_1.ApiClient.getInstance();
            try {
                const response = await apiClient.createCategory({
                    name: naam,
                    color: kleur
                });
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle('Categorie Aangemaakt')
                    .setDescription(`Categorie "${(_a = response.data) === null || _a === void 0 ? void 0 : _a.name}" is succesvol aangemaakt`)
                    .setColor(parseInt(kleur.replace('#', ''), 16))
                    .addFields({ name: 'Naam', value: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.name) || 'Onbekend' }, { name: 'Kleur', value: ((_c = response.data) === null || _c === void 0 ? void 0 : _c.color) || kleur })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            }
            catch (error) {
                // API error handling
                if (error instanceof Error) {
                    logger_1.logger.error('API Error bij aanmaken categorie:', error);
                    throw (0, commandErrors_1.createCommandError)('EXECUTION_ERROR', 'Er is een fout opgetreden bij het aanmaken van de categorie in de database.');
                }
                throw error;
            }
        }
        catch (error) {
            // Centrale error handling
            logger_1.logger.error('Error bij aanmaken categorie:', error);
            const errorMessage = error instanceof discord_types_1.CommandError
                ? error.message
                : 'Er is een onverwachte fout opgetreden bij het aanmaken van de categorie.';
            await interaction.editReply({
                content: errorMessage
            });
        }
    }
});
//# sourceMappingURL=create.js.map