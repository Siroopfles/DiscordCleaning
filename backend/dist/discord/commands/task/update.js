"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.update = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('update')
        .setDescription('Werk een taak bij')
        .addStringOption(option => option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true))
        .addStringOption(option => option
        .setName('titel')
        .setDescription('Nieuwe titel voor de taak')
        .setRequired(false))
        .addStringOption(option => option
        .setName('beschrijving')
        .setDescription('Nieuwe beschrijving voor de taak')
        .setRequired(false))
        .addStringOption(option => option
        .setName('status')
        .setDescription('Nieuwe status voor de taak')
        .setRequired(false)
        .addChoices({ name: 'Open', value: 'OPEN' }, { name: 'In Uitvoering', value: 'IN_PROGRESS' }, { name: 'Voltooid', value: 'COMPLETED' })),
    async execute(interaction) {
        var _a, _b, _c;
        await interaction.deferReply({ ephemeral: true });
        try {
            const taskId = interaction.options.getString('id', true);
            const titel = interaction.options.getString('titel');
            const beschrijving = interaction.options.getString('beschrijving');
            const status = interaction.options.getString('status');
            const apiClient = apiClient_1.ApiClient.getInstance();
            const response = await apiClient.updateTask(taskId, {
                title: titel || undefined,
                description: beschrijving || undefined,
                status: status || undefined
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Taak Bijgewerkt')
                .setDescription(`Taak "${(_a = response.data) === null || _a === void 0 ? void 0 : _a.title}" is succesvol bijgewerkt`)
                .setColor('#ffff00')
                .addFields({ name: 'ID', value: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.id) || 'Onbekend' }, { name: 'Status', value: ((_c = response.data) === null || _c === void 0 ? void 0 : _c.status) || 'Onbekend' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error bij bijwerken taak:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het bijwerken van de taak.'
            });
        }
    },
};
//# sourceMappingURL=update.js.map