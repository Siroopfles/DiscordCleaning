"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    discord_id: {
        type: String,
        required: true,
        unique: true,
        index: true, // Index for faster queries by discord_id
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    settings: {
        notifications: {
            type: Boolean,
            default: true,
        },
        theme: {
            type: String,
            default: 'light',
            enum: ['light', 'dark'],
        },
        language: {
            type: String,
            default: 'nl',
            enum: ['nl', 'en'],
        },
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disable the version key (__v)
});
// Create indexes for common queries
userSchema.index({ username: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map