"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    category: {
        type: String,
        required: true,
        ref: 'Category', // Reference to Category model
        index: true, // Index for faster category-based queries
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        index: true, // Index for priority-based filtering
    },
    status: {
        type: String,
        required: true,
        enum: ['todo', 'in_progress', 'completed'],
        default: 'todo',
        index: true, // Index for status-based filtering
    },
    created_by: {
        type: String,
        required: true,
        ref: 'User',
        index: true, // Index for user-based queries
    },
    assigned_to: {
        type: String,
        ref: 'User',
        index: true, // Index for assignment-based queries
    },
    due_date: {
        type: Date,
        index: true, // Index for due date queries and sorting
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disable the version key (__v)
});
// Compound indexes for common query patterns
taskSchema.index({ status: 1, priority: 1 }); // For filtered views
taskSchema.index({ created_by: 1, due_date: 1 }); // For user's upcoming tasks
taskSchema.index({ assigned_to: 1, status: 1 }); // For user's assigned tasks
exports.Task = (0, mongoose_1.model)('Task', taskSchema);
//# sourceMappingURL=Task.js.map