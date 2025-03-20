"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delete_command = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.delete_command = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('delete')
        .setDescription('Verwijder een taak')
        .addStringOption(option => option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const taskId = interaction.options.getString('id', true);
            const apiClient = apiClient_1.ApiClient.getInstance();
            await apiClient.deleteTask(taskId);
            await interaction.editReply({
                content: `Taak met ID ${taskId} is succesvol verwijderd.`
            });
        }
        catch (error) {
            logger_1.logger.error('Error bij verwijderen taak:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het verwijderen van de taak.'
            });
        }
    },
};
//# sourceMappingURL=delete.js.map