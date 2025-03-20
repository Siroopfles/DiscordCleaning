"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const create_1 = require("./create");
const list_1 = require("./list");
const info_1 = require("./info");
const update_1 = require("./update");
const delete_1 = require("./delete");
const command = {
    data: (() => {
        const builder = new discord_js_1.SlashCommandBuilder()
            .setName('category')
            .setDescription('Beheer categorieën voor taken')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels);
        // Add subcommands
        builder.addSubcommand(create_1.create.data);
        builder.addSubcommand(list_1.list.data);
        builder.addSubcommand(info_1.info.data);
        builder.addSubcommand(update_1.update.data);
        builder.addSubcommand(delete_1.delete_command.data);
        return builder;
    })(),
    subcommands: new discord_js_1.Collection([
        [create_1.create.data.name, create_1.create],
        [list_1.list.data.name, list_1.list],
        [info_1.info.data.name, info_1.info],
        [update_1.update.data.name, update_1.update],
        [delete_1.delete_command.data.name, delete_1.delete_command]
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