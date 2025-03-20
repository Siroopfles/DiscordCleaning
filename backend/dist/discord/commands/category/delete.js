"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delete_command = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const apiClient_1 = require("../../api/apiClient");
exports.delete_command = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('delete')
        .setDescription('Verwijder een categorie')
        .addStringOption(option => option
        .setName('id')
        .setDescription('Het ID van de categorie')
        .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const categoryId = interaction.options.getString('id', true);
            const apiClient = apiClient_1.ApiClient.getInstance();
            // Controleer eerst of de categorie bestaat
            const categoryResponse = await apiClient.getCategory(categoryId);
            if (!categoryResponse.success || !categoryResponse.data) {
                await interaction.editReply({
                    content: 'Deze categorie bestaat niet.'
                });
                return;
            }
            // Haal alle taken op om te controleren of er nog taken in de categorie zitten
            const tasksResponse = await apiClient.getTasks();
            if (tasksResponse.success && tasksResponse.data) {
                const tasksInCategory = tasksResponse.data.filter(task => task.categoryId === categoryId);
                if (tasksInCategory.length > 0) {
                    await interaction.editReply({
                        content: `Deze categorie kan niet worden verwijderd omdat er nog ${tasksInCategory.length} taken aan gekoppeld zijn. Verplaats of verwijder eerst alle taken uit deze categorie.`
                    });
                    return;
                }
            }
            // Verwijder de categorie
            await apiClient.deleteCategory(categoryId);
            // Maak een embed voor de bevestiging
            const confirmationEmbed = new discord_js_1.EmbedBuilder()
                .setTitle('Categorie Verwijderd')
                .setDescription(`De categorie "${categoryResponse.data.name}" is succesvol verwijderd.`)
                .setColor('#00FF00')
                .setTimestamp();
            await interaction.editReply({
                embeds: [confirmationEmbed]
            });
        }
        catch (error) {
            logger_1.logger.error('Error bij verwijderen categorie:', error);
            // Bepaal het juiste foutbericht op basis van de error
            let errorMessage = 'Er is een fout opgetreden bij het verwijderen van de categorie.';
            if (error instanceof Error) {
                if (error.message.includes('niet gevonden')) {
                    errorMessage = 'Deze categorie bestaat niet.';
                }
                else if (error.message.includes('Ongeldige aanvraag')) {
                    errorMessage = 'De opgegeven categorie ID is ongeldig.';
                }
            }
            await interaction.editReply({
                content: errorMessage
            });
        }
    },
};
//# sourceMappingURL=delete.js.map