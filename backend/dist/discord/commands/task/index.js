"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const create_1 = require("./create");
const list_1 = require("./list");
const delete_1 = require("./delete");
const update_1 = require("./update");
const assign_1 = require("./assign");
const complete_1 = require("./complete");
const command = {
    data: (() => {
        const builder = new discord_js_1.SlashCommandBuilder()
            .setName('task')
            .setDescription('Beheer taken en projecten');
        // Add subcommands
        builder.addSubcommand(create_1.create.data);
        builder.addSubcommand(list_1.list.data);
        builder.addSubcommand(delete_1.delete_command.data);
        builder.addSubcommand(update_1.update.data);
        builder.addSubcommand(assign_1.assign.data);
        builder.addSubcommand(complete_1.complete.data);
        return builder;
    })(),
    subcommands: new discord_js_1.Collection([
        [create_1.create.data.name, create_1.create],
        [list_1.list.data.name, list_1.list],
        [delete_1.delete_command.data.name, delete_1.delete_command],
        [update_1.update.data.name, update_1.update],
        [assign_1.assign.data.name, assign_1.assign],
        [complete_1.complete.data.name, complete_1.complete]
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