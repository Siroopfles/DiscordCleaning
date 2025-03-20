"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transfer = void 0;
const discord_js_1 = require("discord.js");
const currency_service_1 = require("../../../services/currency.service");
const errors_1 = require("../../../utils/errors");
exports.transfer = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('transfer')
        .setDescription('Maak valuta over naar een andere gebruiker')
        .addUserOption(option => option
        .setName('user')
        .setDescription('De gebruiker die de valuta moet ontvangen')
        .setRequired(true))
        .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Het aantal credits om over te maken')
        .setRequired(true)
        .setMinValue(1))
        .addStringOption(option => option
        .setName('description')
        .setDescription('Beschrijving voor de transactie')
        .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const description = interaction.options.getString('description') || 'Valuta transfer';
            const serverId = interaction.guildId;
            if (!targetUser || !amount) {
                throw new errors_1.BadRequestError('Ongeldige parameters voor transfer');
            }
            if (targetUser.id === interaction.user.id) {
                throw new errors_1.BadRequestError('Je kunt geen valuta naar jezelf overmaken');
            }
            const result = await currency_service_1.currencyService.transferCurrency(interaction.user.id, targetUser.id, serverId, amount, description);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💸 Valuta Transfer Succesvol')
                .addFields({
                name: 'Van',
                value: interaction.user.username,
                inline: true
            }, {
                name: 'Naar',
                value: targetUser.username,
                inline: true
            }, {
                name: 'Bedrag',
                value: `${amount} credits`,
                inline: true
            }, {
                name: 'Nieuw Saldo',
                value: `${result.fromBalance.balance} credits`,
                inline: true
            }, {
                name: 'Beschrijving',
                value: description
            })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Transfer command error:', error);
            const errorMessage = error instanceof errors_1.BadRequestError
                ? error.message
                : 'Er is een fout opgetreden bij het uitvoeren van de transfer.';
            await interaction.editReply({
                content: errorMessage
            });
        }
    },
};
//# sourceMappingURL=transfer.js.map