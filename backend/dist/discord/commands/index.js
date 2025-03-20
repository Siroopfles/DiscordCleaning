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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandRegistry = exports.commandLoader = void 0;
exports.loadCommands = loadCommands;
const discord_js_1 = require("discord.js");
const discord_types_1 = require("../types/discord.types");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../../utils/logger"));
const commandErrors_1 = require("../utils/commandErrors");
const commandMiddleware_1 = require("../utils/commandMiddleware");
// Implementatie van de CommandLoader interface
class DefaultCommandLoader {
    async findCommandFiles(dir) {
        const files = [];
        try {
            const entries = await fs_1.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.findCommandFiles(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.name === 'index.ts' || entry.name === 'index.js') {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error searching for command files', { error, dir });
        }
        return files;
    }
    async loadCommand(filePath) {
        try {
            const commandModule = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
            const command = commandModule.default;
            if (await this.validateCommand(command)) {
                // Voeg middleware en error handling toe
                const processedCommand = (0, commandMiddleware_1.withMiddleware)(command);
                processedCommand.execute = (0, commandErrors_1.withErrorHandling)(processedCommand.execute);
                processedCommand.category = path_1.default.basename(path_1.default.dirname(filePath));
                return processedCommand;
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Error loading command', { error, filePath });
            return null;
        }
    }
    async validateCommand(command) {
        if (!(command === null || command === void 0 ? void 0 : command.data) || !(command === null || command === void 0 ? void 0 : command.execute)) {
            logger_1.default.warn('Invalid command structure');
            return false;
        }
        return true;
    }
    async loadCommands() {
        const commands = new discord_js_1.Collection();
        const commandsPath = path_1.default.join(__dirname);
        try {
            const files = await this.findCommandFiles(commandsPath);
            for (const file of files) {
                const command = await this.loadCommand(file);
                if (command) {
                    commands.set(command.data.name, command);
                    logger_1.default.info('Command loaded', {
                        name: command.data.name,
                        category: command.category
                    });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error in command loading process', { error });
        }
        return commands;
    }
}
// Implementatie van de CommandRegistry interface
class DefaultCommandRegistry {
    constructor() {
        this.commands = new discord_js_1.Collection();
    }
    async registerCommand(command) {
        try {
            if (this.commands.has(command.data.name)) {
                throw new Error(`Command ${command.data.name} already exists`);
            }
            this.commands.set(command.data.name, command);
            logger_1.default.info('Command registered', { name: command.data.name });
        }
        catch (error) {
            throw new discord_types_1.CommandError('REGISTRATION_ERROR', `Failed to register command: ${command.data.name}`, command.data.name, undefined, error);
        }
    }
    async registerCommands(commands) {
        for (const command of commands) {
            await this.registerCommand(command);
        }
    }
    getCommand(name) {
        return this.commands.get(name);
    }
    getCommandsByCategory(category) {
        return Array.from(this.commands.values())
            .filter(command => command.category === category);
    }
}
// Exporteer de implementaties en functie voor het laden van commands
exports.commandLoader = new DefaultCommandLoader();
exports.commandRegistry = new DefaultCommandRegistry();
async function loadCommands() {
    const commands = await exports.commandLoader.loadCommands();
    await exports.commandRegistry.registerCommands(Array.from(commands.values()));
    return commands;
}
//# sourceMappingURL=index.js.map