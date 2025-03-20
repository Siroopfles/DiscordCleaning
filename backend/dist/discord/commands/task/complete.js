"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complete = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.complete = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('complete')
        .setDescription('Markeer een taak als voltooid')
        .addStringOption(option => option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true)),
    async execute(interaction) {
        var _a, _b, _c;
        await interaction.deferReply({ ephemeral: true });
        try {
            const taskId = interaction.options.getString('id', true);
            const apiClient = apiClient_1.ApiClient.getInstance();
            const response = await apiClient.updateTask(taskId, {
                status: 'COMPLETED'
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Taak Voltooid')
                .setDescription(`Taak "${(_a = response.data) === null || _a === void 0 ? void 0 : _a.title}" is gemarkeerd als voltooid`)
                .setColor('#00ff00')
                .addFields({ name: 'ID', value: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.id) || 'Onbekend' }, { name: 'Status', value: ((_c = response.data) === null || _c === void 0 ? void 0 : _c.status) || 'COMPLETED' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error bij voltooien taak:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het voltooien van de taak.'
            });
        }
    },
};
//# sourceMappingURL=complete.js.map