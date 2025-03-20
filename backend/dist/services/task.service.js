"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = exports.TaskService = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const task_repository_1 = require("../repositories/task.repository");
const ApiError_1 = require("../utils/ApiError");
// Validation schemas
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(1000).optional(),
    category: zod_1.z.string(),
    priority: zod_1.z.enum(['low', 'medium', 'high']),
    status: zod_1.z.enum(['todo', 'in_progress', 'completed']),
    created_by: zod_1.z.string(),
    assigned_to: zod_1.z.string().optional(),
    due_date: zod_1.z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});
exports.updateTaskSchema = exports.createTaskSchema.partial();
class TaskService {
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async createTask(data) {
        try {
            const validatedData = exports.createTaskSchema.parse(data);
            return await this.taskRepository.create(validatedData);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new ApiError_1.ApiError(400, 'Validation error', error.errors);
            }
            if (error instanceof Error) {
                throw new ApiError_1.ApiError(500, error.message);
            }
            throw error;
        }
    }
    async getTaskById(id) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new ApiError_1.ApiError(404, 'Task not found');
        }
        return task;
    }
    async getTasks(filters = {}) {
        return await this.taskRepository.findAll(filters);
    }
    async updateTask(id, data) {
        try {
            const validatedData = exports.updateTaskSchema.parse(data);
            const updatedTask = await this.taskRepository.update(id, validatedData);
            if (!updatedTask) {
                throw new ApiError_1.ApiError(404, 'Task not found');
            }
            return updatedTask;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new ApiError_1.ApiError(400, 'Validation error', error.errors);
            }
            if (error instanceof Error) {
                throw new ApiError_1.ApiError(500, error.message);
            }
            throw error;
        }
    }
    async deleteTask(id) {
        const task = await this.taskRepository.delete(id);
        if (!task) {
            throw new ApiError_1.ApiError(404, 'Task not found');
        }
        return task;
    }
    async getUserTasks(userId) {
        return await this.taskRepository.findUserTasks(userId);
    }
    async getTasksByFilter(filter) {
        return await this.taskRepository.findByFilter(filter);
    }
}
exports.TaskService = TaskService;
exports.taskService = new TaskService(task_repository_1.taskRepository);
//# sourceMappingURL=task.service.js.map