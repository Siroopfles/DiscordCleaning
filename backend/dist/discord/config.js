"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT = exports.clientConfig = exports.CLIENT_ID = exports.BOT_TOKEN = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
dotenv_1.default.config();
// Bot configuratie
exports.BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
exports.CLIENT_ID = process.env.DISCORD_CLIENT_ID;
if (!exports.BOT_TOKEN || !exports.CLIENT_ID) {
    throw new Error('Missing required Discord configuration in environment variables');
}
// Discord.js client configuratie
exports.clientConfig = {
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
};
// Rate limiting configuratie
exports.RATE_LIMIT = {
    commands: {
        windowMs: 60000, // 1 minuut
        max: 10, // max 10 commands per minuut
    },
};
//# sourceMappingURL=config.js.map