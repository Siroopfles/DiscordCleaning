"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const task_service_1 = require("../services/task.service");
const task_repository_1 = require("../repositories/task.repository");
const ApiError_1 = require("../utils/ApiError");
const mongoose_1 = require("mongoose");
// Mock TaskRepository
jest.mock('../repositories/task.repository');
describe('TaskService', () => {
    let taskService;
    let mockTaskRepository;
    const mockTask = {
        title: 'Test Task',
        description: 'Test Description',
        category: new mongoose_1.Types.ObjectId().toString(),
        priority: 'medium',
        status: 'todo',
        created_by: new mongoose_1.Types.ObjectId().toString(),
        created_at: new Date(),
        updated_at: new Date(),
    };
    beforeEach(() => {
        mockTaskRepository = new task_repository_1.TaskRepository();
        taskService = new task_service_1.TaskService(mockTaskRepository);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createTask', () => {
        it('should create a task successfully', async () => {
            mockTaskRepository.create.mockResolvedValue(mockTask);
            const result = await taskService.createTask(mockTask);
            expect(result).toEqual(mockTask);
            expect(mockTaskRepository.create).toHaveBeenCalledWith(mockTask);
        });
        it('should throw validation error for invalid data', async () => {
            const invalidTask = Object.assign(Object.assign({}, mockTask), { priority: 'invalid' });
            await expect(taskService.createTask(invalidTask))
                .rejects
                .toThrow(ApiError_1.ApiError);
        });
    });
    describe('getTaskById', () => {
        it('should return task by id', async () => {
            mockTaskRepository.findById.mockResolvedValue(mockTask);
            const result = await taskService.getTaskById('123');
            expect(result).toEqual(mockTask);
            expect(mockTaskRepository.findById).toHaveBeenCalledWith('123');
        });
        it('should throw not found error for non-existent task', async () => {
            mockTaskRepository.findById.mockResolvedValue(null);
            await expect(taskService.getTaskById('123'))
                .rejects
                .toThrow(new ApiError_1.ApiError(404, 'Task not found'));
        });
    });
    describe('updateTask', () => {
        const updateData = { title: 'Updated Title' };
        it('should update task successfully', async () => {
            const updatedTask = Object.assign(Object.assign({}, mockTask), updateData);
            mockTaskRepository.update.mockResolvedValue(updatedTask);
            const result = await taskService.updateTask('123', updateData);
            expect(result).toEqual(updatedTask);
            expect(mockTaskRepository.update).toHaveBeenCalledWith('123', updateData);
        });
        it('should throw not found error for non-existent task', async () => {
            mockTaskRepository.update.mockResolvedValue(null);
            await expect(taskService.updateTask('123', updateData))
                .rejects
                .toThrow(new ApiError_1.ApiError(404, 'Task not found'));
        });
    });
    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            mockTaskRepository.delete.mockResolvedValue(mockTask);
            const result = await taskService.deleteTask('123');
            expect(result).toEqual(mockTask);
            expect(mockTaskRepository.delete).toHaveBeenCalledWith('123');
        });
        it('should throw not found error for non-existent task', async () => {
            mockTaskRepository.delete.mockResolvedValue(null);
            await expect(taskService.deleteTask('123'))
                .rejects
                .toThrow(new ApiError_1.ApiError(404, 'Task not found'));
        });
    });
    describe('getTasks', () => {
        it('should return filtered tasks', async () => {
            const filter = { status: 'todo' };
            mockTaskRepository.findAll.mockResolvedValue([mockTask]);
            const result = await taskService.getTasks(filter);
            expect(result).toEqual([mockTask]);
            expect(mockTaskRepository.findAll).toHaveBeenCalledWith(filter);
        });
    });
    describe('getUserTasks', () => {
        it('should return user tasks', async () => {
            mockTaskRepository.findUserTasks.mockResolvedValue([mockTask]);
            const result = await taskService.getUserTasks('userId');
            expect(result).toEqual([mockTask]);
            expect(mockTaskRepository.findUserTasks).toHaveBeenCalledWith('userId');
        });
    });
});
//# sourceMappingURL=task.service.test.js.map