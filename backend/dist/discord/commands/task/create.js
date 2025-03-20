"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.create = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('create')
        .setDescription('Maak een nieuwe taak aan')
        .addStringOption(option => option
        .setName('titel')
        .setDescription('De titel van de taak')
        .setRequired(true))
        .addStringOption(option => option
        .setName('beschrijving')
        .setDescription('Een beschrijving van de taak')
        .setRequired(false))
        .addStringOption(option => option
        .setName('categorie')
        .setDescription('De categorie van de taak')
        .setRequired(false)),
    async execute(interaction) {
        var _a, _b, _c;
        await interaction.deferReply({ ephemeral: true });
        try {
            const titel = interaction.options.getString('titel', true);
            const beschrijving = interaction.options.getString('beschrijving');
            const categorie = interaction.options.getString('categorie');
            const apiClient = apiClient_1.ApiClient.getInstance();
            const response = await apiClient.createTask({
                title: titel,
                description: beschrijving || undefined,
                categoryId: categorie || undefined
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Taak Aangemaakt')
                .setDescription(`Taak "${(_a = response.data) === null || _a === void 0 ? void 0 : _a.title}" is succesvol aangemaakt`)
                .setColor('#00ff00')
                .addFields({ name: 'ID', value: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.id) || 'Onbekend' }, { name: 'Status', value: ((_c = response.data) === null || _c === void 0 ? void 0 : _c.status) || 'OPEN' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error bij aanmaken taak:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het aanmaken van de taak.'
            });
        }
    },
};
//# sourceMappingURL=create.js.map