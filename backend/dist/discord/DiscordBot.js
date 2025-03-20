"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const commandHandler_1 = require("./handlers/commandHandler");
const logger_1 = require("./utils/logger");
class DiscordBot {
    constructor() {
        this.client = new discord_js_1.Client(config_1.clientConfig);
        this.commandHandler = new commandHandler_1.CommandHandler(this.client);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Bij ready event
        this.client.on('ready', () => {
            var _a;
            logger_1.logger.info(`Bot is online als ${(_a = this.client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
        });
        // Bij interactie (slash commands)
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            try {
                const command = this.commandHandler.getCommand(interaction.commandName);
                if (!command) {
                    await interaction.reply({
                        content: 'Dit commando bestaat niet!',
                        ephemeral: true
                    });
                    return;
                }
                await command.execute(interaction);
            }
            catch (error) {
                logger_1.logger.error('Error bij command uitvoering:', error);
                const errorMessage = {
                    content: 'Er is een fout opgetreden bij het uitvoeren van dit commando.',
                    ephemeral: true
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                }
                else {
                    await interaction.reply(errorMessage);
                }
            }
        });
        // Error handling
        this.client.on('error', (error) => {
            logger_1.logger.error('Discord client error:', error);
        });
    }
    async start() {
        try {
            await this.commandHandler.loadCommands();
            await this.client.login(config_1.BOT_TOKEN);
            logger_1.logger.info('Bot succesvol gestart');
        }
        catch (error) {
            logger_1.logger.error('Fout bij het starten van de bot:', error);
            throw error;
        }
    }
    async stop() {
        try {
            await this.client.destroy();
            logger_1.logger.info('Bot succesvol gestopt');
        }
        catch (error) {
            logger_1.logger.error('Fout bij het stoppen van de bot:', error);
            throw error;
        }
    }
}
exports.DiscordBot = DiscordBot;
//# sourceMappingURL=DiscordBot.js.map