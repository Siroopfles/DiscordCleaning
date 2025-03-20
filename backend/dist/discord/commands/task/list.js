"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.list = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('list')
        .setDescription('Toon alle taken'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const apiClient = apiClient_1.ApiClient.getInstance();
            const response = await apiClient.getTasks();
            if (!response.data || response.data.length === 0) {
                await interaction.editReply({
                    content: 'Er zijn nog geen taken aangemaakt.',
                });
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Taken Overzicht')
                .setColor('#0099ff')
                .setTimestamp();
            response.data.forEach(task => {
                embed.addFields({
                    name: `${task.title} (${task.status})`,
                    value: task.description || 'Geen beschrijving',
                    inline: false
                });
            });
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error bij ophalen taken:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het ophalen van de taken.'
            });
        }
    },
};
//# sourceMappingURL=list.js.map