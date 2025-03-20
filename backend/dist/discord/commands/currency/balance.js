"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balance = void 0;
const discord_js_1 = require("discord.js");
const currency_service_1 = require("../../../services/currency.service");
exports.balance = {
    data: new discord_js_1.SlashCommandSubcommandBuilder()
        .setName('balance')
        .setDescription('Bekijk je huidige valuta saldo'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const serverId = interaction.guildId;
            const balance = await currency_service_1.currencyService.getBalance(targetUser.id, serverId);
            const stats = await currency_service_1.currencyService.getUserStatistics(targetUser.id, serverId);
            const rewardStats = stats.statistics.reward || { total: 0, count: 0 };
            const transferStats = stats.statistics.transfer || { total: 0, count: 0 };
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`💰 Valuta Saldo: ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields({
                name: 'Huidig Saldo',
                value: `${balance.balance} credits`,
                inline: true
            }, {
                name: 'Totaal Ontvangen',
                value: `${rewardStats.total || 0} credits`,
                inline: true
            }, {
                name: 'Transactie Statistieken',
                value: `Beloningen: ${rewardStats.count || 0}\nTransfers: ${transferStats.count || 0}`
            })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Balance command error:', error);
            await interaction.editReply({
                content: 'Er is een fout opgetreden bij het ophalen van het saldo.'
            });
        }
    },
};
//# sourceMappingURL=balance.js.map