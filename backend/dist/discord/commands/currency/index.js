"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const balance_1 = require("./balance");
const transfer_1 = require("./transfer");
const history_1 = require("./history");
const leaderboard_1 = require("./leaderboard");
const command = {
    data: (() => {
        const builder = new discord_js_1.SlashCommandBuilder()
            .setName('currency')
            .setDescription('Beheer je server valuta');
        // Add subcommands
        builder.addSubcommand(balance_1.balance.data);
        builder.addSubcommand(transfer_1.transfer.data);
        builder.addSubcommand(history_1.history.data);
        builder.addSubcommand(leaderboard_1.leaderboard.data);
        return builder;
    })(),
    subcommands: new discord_js_1.Collection([
        [balance_1.balance.data.name, balance_1.balance],
        [transfer_1.transfer.data.name, transfer_1.transfer],
        [history_1.history.data.name, history_1.history],
        [leaderboard_1.leaderboard.data.name, leaderboard_1.leaderboard]
    ]),
    async execute(interaction) {
        var _a;
        // Get the subcommand that was used
        const subcommand = interaction.options.getSubcommand();
        // Get the subcommand handler from our collection
        const handler = (_a = command.subcommands) === null || _a === void 0 ? void 0 : _a.get(subcommand);
        if (!handler) {
            await interaction.reply({
                content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
                ephemeral: true
            });
            return;
        }
        // Execute the subcommand
        await handler.execute(interaction);
    }
};
exports.default = command;
//# sourceMappingURL=index.js.map