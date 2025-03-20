"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandError = void 0;
class CommandError extends Error {
    constructor(type, message, command, parameter, details) {
        super(message);
        this.type = type;
        this.command = command;
        this.parameter = parameter;
        this.details = details;
        this.name = 'CommandError';
    }
}
exports.CommandError = CommandError;
//# sourceMappingURL=discord.types.js.map