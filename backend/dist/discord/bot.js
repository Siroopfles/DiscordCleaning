"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
const discord_1 = require("../config/discord");
class DiscordBot {
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.GuildMembers
            ]
        });
        this.commands = new discord_js_1.Collection();
    }
    async start() {
        // Load commands
        this.commands = await (0, commands_1.loadCommands)();
        // Register event handlers
        this.client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            const command = this.commands.get(interaction.commandName);
            if (!command)
                return;
            try {
                await command.execute(interaction);
            }
            catch (error) {
                console.error(error);
                const content = 'Er is een fout opgetreden bij het uitvoeren van dit commando.';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, ephemeral: true });
                }
                else {
                    await interaction.reply({ content, ephemeral: true });
                }
            }
        });
        // Login
        await this.client.login(discord_1.config.token);
        console.log('Discord bot is online!');
    }
}
exports.bot = new DiscordBot();
//# sourceMappingURL=bot.js.map