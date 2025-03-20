"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        unique: true,
        index: true, // Index for name lookups
    },
    color: {
        type: String,
        required: true,
        validate: {
            validator: (value) => {
                // Validate hex color code (e.g., #FF0000)
                return /^#[0-9A-F]{6}$/i.test(value);
            },
            message: 'Color must be a valid hex color code (e.g., #FF0000)',
        },
    },
    created_by: {
        type: String,
        required: true,
        ref: 'User',
        index: true, // Index for user-based queries
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disable the version key (__v)
});
// Ensure case-insensitive unique category names per server
categorySchema.index({
    name: 1,
    created_by: 1
}, {
    unique: true,
    collation: { locale: 'en', strength: 2 }
});
exports.Category = (0, mongoose_1.model)('Category', categorySchema);
//# sourceMappingURL=Category.js.map