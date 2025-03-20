"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const mongoose_1 = require("mongoose");
const serverSchema = new mongoose_1.Schema({
    discord_server_id: {
        type: String,
        required: true,
        unique: true,
        index: true, // Index for discord server ID lookups
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    settings: {
        prefix: {
            type: String,
            default: '!',
            maxlength: 3,
            validate: {
                validator: (value) => {
                    // Prefix should not contain whitespace or special characters except ! $ % ^ & *
                    return /^[!$%^&*]{1,3}$/.test(value);
                },
                message: 'Prefix must be 1-3 characters and can only contain ! $ % ^ & *',
            },
        },
        language: {
            type: String,
            default: 'nl',
            enum: ['nl', 'en'],
        },
        timezone: {
            type: String,
            default: 'Europe/Amsterdam',
            validate: {
                validator: (value) => {
                    // Basic timezone validation
                    try {
                        Intl.DateTimeFormat(undefined, { timeZone: value });
                        return true;
                    }
                    catch (e) {
                        return false;
                    }
                },
                message: 'Invalid timezone',
            },
        },
        notification_channel: {
            type: String,
            sparse: true, // Allow null/undefined values
            index: true, // Index for notification channel lookups
        },
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disable the version key (__v)
});
// Compound index for common query patterns
serverSchema.index({
    'settings.language': 1,
    'settings.timezone': 1,
});
exports.Server = (0, mongoose_1.model)('Server', serverSchema);
//# sourceMappingURL=Server.js.map