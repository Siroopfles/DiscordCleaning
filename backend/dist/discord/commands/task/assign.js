"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assign = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.assign = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('assign')
        .setDescription('Wijs een taak toe aan een gebruiker')
        .addStringOption(option => option
        .setName('id')
        .setDescription('Het ID van de taak')
        .setRequired(true))
        .addUserOption(option => option
        .setName('gebruiker')
        .setDescription('De gebruiker aan wie de taak wordt toegewezen')
        .setRequired(true)),
    async execute(interaction) {
        var _a, _b, _c;
        await interaction.deferReply({ ephemeral: true });
        try {
            const taskId = interaction.options.getString('id', true);
            const assignee = interaction.options.getUser('gebruiker', true);
            const apiClient = apiClient_1.ApiClient.getInstance();
            const response = await apiClient.updateTask(taskId, {
                assigned_to: assignee.id
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Taak Toegewezen')
                .setDescription(`Taak "${(_a = response.data) === null || _a === void 0 ? void 0 : _a.title}" is toegewezen aan ${assignee.username}`)
                .setColor('#00ff00')
                .addFields({ name: 'ID', value: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.id) || 'Onbekend' }, { name: 'Status', value: ((_c = response.data) === null || _c === void 0 ? void 0 : _c.status) || 'Onbekend' }, { name: 'Toegewezen aan', value: assignee.username })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error bij toewijzen taak:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het toewijzen van de taak.'
            });
        }
    },
};
//# sourceMappingURL=assign.js.map