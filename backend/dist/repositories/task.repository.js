"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRepository = exports.TaskRepository = void 0;
const Task_1 = require("../models/Task");
class TaskRepository {
    async create(taskData) {
        const task = new Task_1.Task(taskData);
        return await task.save();
    }
    async findById(id) {
        return await Task_1.Task.findById(id);
    }
    async findAll(filter = {}) {
        return await Task_1.Task.find(filter)
            .sort({ created_at: -1 })
            .populate('category', 'name color')
            .populate('created_by', 'username')
            .populate('assigned_to', 'username');
    }
    async update(id, updateData) {
        return await Task_1.Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('category', 'name color')
            .populate('created_by', 'username')
            .populate('assigned_to', 'username');
    }
    async delete(id) {
        return await Task_1.Task.findByIdAndDelete(id);
    }
    async findByFilter(filter) {
        return await Task_1.Task.find(filter)
            .sort({ created_at: -1 })
            .populate('category', 'name color')
            .populate('created_by', 'username')
            .populate('assigned_to', 'username');
    }
    async findUserTasks(userId) {
        return await Task_1.Task.find({
            $or: [{ created_by: userId }, { assigned_to: userId }]
        })
            .sort({ due_date: 1, priority: -1 })
            .populate('category', 'name color')
            .populate('created_by', 'username')
            .populate('assigned_to', 'username');
    }
}
exports.TaskRepository = TaskRepository;
exports.taskRepository = new TaskRepository();
//# sourceMappingURL=task.repository.js.map