"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.update = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('update')
        .setDescription('Werk een bestaande categorie bij')
        .addStringOption(option => option
        .setName('id')
        .setDescription('Het ID van de categorie')
        .setRequired(true))
        .addStringOption(option => option
        .setName('naam')
        .setDescription('De nieuwe naam van de categorie')
        .setRequired(false))
        .addStringOption(option => option
        .setName('kleur')
        .setDescription('De nieuwe kleur van de categorie (hex code, bijv: #FF0000)')
        .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const categoryId = interaction.options.getString('id', true);
            const newName = interaction.options.getString('naam');
            const newColor = interaction.options.getString('kleur');
            // Check if at least one optional parameter is provided
            if (!newName && !newColor) {
                await interaction.editReply({
                    content: 'Je moet ten minste een nieuwe naam of kleur opgeven.'
                });
                return;
            }
            // Validate color format if provided
            if (newColor && !newColor.match(/^#[0-9A-Fa-f]{6}$/)) {
                await interaction.editReply({
                    content: 'De kleur moet een geldige hex code zijn (bijv: #FF0000)'
                });
                return;
            }
            const apiClient = apiClient_1.ApiClient.getInstance();
            // First get the current category to check if it exists
            const currentCategory = await apiClient.getCategory(categoryId);
            if (!currentCategory.data) {
                await interaction.editReply({
                    content: 'Deze categorie bestaat niet.'
                });
                return;
            }
            // Prepare update data
            const updateData = {};
            if (newName)
                updateData.name = newName;
            if (newColor)
                updateData.color = newColor;
            // Update the category
            const response = await apiClient.updateCategory(categoryId, updateData);
            // Create preview embed showing old and new values
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Categorie Bijgewerkt')
                .setDescription(`Categorie "${currentCategory.data.name}" is succesvol bijgewerkt`)
                .setColor(parseInt((newColor || currentCategory.data.color).replace('#', ''), 16))
                .addFields({
                name: 'Naam',
                value: `${currentCategory.data.name} → ${newName || currentCategory.data.name}`,
                inline: true
            }, {
                name: 'Kleur',
                value: `${currentCategory.data.color} → ${newColor || currentCategory.data.color}`,
                inline: true
            })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error bij bijwerken categorie:', error);
            // Handle specific error cases
            if (error instanceof Error) {
                if (error.message.includes('niet gevonden')) {
                    await interaction.editReply({
                        content: 'Deze categorie kon niet worden gevonden.'
                    });
                    return;
                }
            }
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het bijwerken van de categorie.'
            });
        }
    },
};
//# sourceMappingURL=update.js.map