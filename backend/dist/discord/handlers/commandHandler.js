"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
class CommandHandler {
    constructor(client) {
        this.client = client;
        this.client.commands = new discord_js_1.Collection();
        this.commandsPath = path.join(__dirname, '..', 'commands');
    }
    async loadCommandsFromDirectory(directoryPath) {
        const commands = [];
        const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directoryPath, entry.name);
            if (entry.isDirectory()) {
                // Directory gevonden, recursief verwerken als mogelijke subcommands
                const parentCommand = await this.processDirectoryAsCommand(fullPath, entry.name);
                if (parentCommand) {
                    commands.push(parentCommand);
                }
            }
            else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
                // Direct command file gevonden
                try {
                    const command = require(fullPath).default;
                    if (this.isValidCommand(command)) {
                        commands.push(command);
                    }
                }
                catch (error) {
                    logger_1.logger.warn(`Error loading command file ${fullPath}:`, error);
                }
            }
        }
        return commands;
    }
    async processDirectoryAsCommand(dirPath, dirName) {
        // Zoek naar index.ts/js als hoofdcommand
        const indexFile = fs.readdirSync(dirPath)
            .find(file => file.startsWith('index.') && (file.endsWith('.ts') || file.endsWith('.js')));
        if (!indexFile) {
            // Geen index file gevonden, verwerk als normale subdirectory
            const subCommands = await this.loadCommandsFromDirectory(dirPath);
            return subCommands.length > 0 ? null : null;
        }
        // Laad hoofdcommand uit index file
        const indexPath = path.join(dirPath, indexFile);
        try {
            const command = require(indexPath).default;
            if (!this.isValidCommand(command)) {
                return null;
            }
            // Initialiseer subcommands collection
            command.subcommands = new discord_js_1.Collection();
            // Laad alle andere files in de directory als subcommands
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile() || entry.name === indexFile || !(entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
                    continue;
                }
                const subPath = path.join(dirPath, entry.name);
                try {
                    const subCommand = require(subPath).default;
                    if (this.isValidSubCommand(subCommand)) {
                        command.subcommands.set(subCommand.data.name, subCommand);
                        logger_1.logger.info(`Loaded subcommand ${subCommand.data.name} for ${command.data.name}`);
                    }
                }
                catch (error) {
                    logger_1.logger.warn(`Error loading subcommand ${subPath}:`, error);
                }
            }
            return command;
        }
        catch (error) {
            logger_1.logger.warn(`Error loading command index ${indexPath}:`, error);
            return null;
        }
    }
    isValidCommand(command) {
        return command && 'data' in command && 'execute' in command;
    }
    isValidSubCommand(command) {
        return command && 'data' in command && 'execute' in command;
    }
    async loadCommands() {
        var _a, _b;
        try {
            // Controleer of de commands directory bestaat
            if (!fs.existsSync(this.commandsPath)) {
                fs.mkdirSync(this.commandsPath, { recursive: true });
            }
            const commands = await this.loadCommandsFromDirectory(this.commandsPath);
            // Registreer alle commands
            for (const command of commands) {
                this.client.commands.set(command.data.name, command);
                const subCommandCount = (_b = (_a = command.subcommands) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
                logger_1.logger.info(`Loaded command: ${command.data.name}` +
                    (subCommandCount > 0 ? ` with ${subCommandCount} subcommands` : ''));
            }
            logger_1.logger.info(`Loaded ${this.client.commands.size} commands successfully`);
        }
        catch (error) {
            logger_1.logger.error('Error loading commands:', error);
            throw error;
        }
    }
    getCommand(name) {
        return this.client.commands.get(name);
    }
    getSubCommand(command, subcommandName) {
        var _a;
        return (_a = command.subcommands) === null || _a === void 0 ? void 0 : _a.get(subcommandName);
    }
}
exports.CommandHandler = CommandHandler;
//# sourceMappingURL=commandHandler.js.map