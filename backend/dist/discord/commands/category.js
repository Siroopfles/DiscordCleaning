"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
const apiClient_1 = require("../api/apiClient");
const categoryCommand = new discord_js_1.SlashCommandBuilder()
    .setName('category')
    .setDescription('Beheer categorieën')
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('Toon alle beschikbare categorieën'));
const execute = async (interaction) => {
    const subcommand = interaction.options.getSubcommand();
    try {
        if (subcommand === 'list') {
            await handleListCategories(interaction);
        }
        else {
            await interaction.reply({
                content: 'Onbekend subcommando',
                ephemeral: true
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error bij category command:', error);
        await interaction.reply({
            content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
            ephemeral: true
        });
    }
};
async function handleListCategories(interaction) {
    try {
        const apiClient = apiClient_1.ApiClient.getInstance();
        const response = await apiClient.getCategories();
        if (!response.data || response.data.length === 0) {
            await interaction.reply({
                content: 'Er zijn nog geen categorieën beschikbaar.',
                ephemeral: true
            });
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Beschikbare Categorieën')
            .setColor('#00ff00')
            .setTimestamp();
        response.data.forEach(category => {
            embed.addFields({
                name: category.name,
                value: category.description || 'Geen beschrijving',
                inline: true
            });
        });
        await interaction.reply({ embeds: [embed] });
    }
    catch (error) {
        logger_1.logger.error('Error bij ophalen categorieën:', error);
        await interaction.reply({
            content: 'Er is een fout opgetreden bij het ophalen van de categorieën.',
            ephemeral: true
        });
    }
}
exports.default = {
    data: categoryCommand,
    execute
};
//# sourceMappingURL=category.js.map