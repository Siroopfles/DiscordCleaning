import { TaskService } from '../services/task.service';
import { TaskRepository } from '../repositories/task.repository';
import { ApiError } from '../utils/ApiError';
import { ITask } from '../types/models';
import { Types } from 'mongoose';

// Mock TaskRepository
jest.mock('../repositories/task.repository');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;

  const mockTask: ITask = {
    title: 'Test Task',
    description: 'Test Description',
    category: new Types.ObjectId().toString(),
    priority: 'medium',
    status: 'todo',
    created_by: new Types.ObjectId().toString(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockTaskRepository = new TaskRepository() as jest.Mocked<TaskRepository>;
    taskService = new TaskService(mockTaskRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      mockTaskRepository.create.mockResolvedValue(mockTask as any);

      const result = await taskService.createTask(mockTask);
      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(mockTask);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidTask = { ...mockTask, priority: 'invalid' as 'low' | 'medium' | 'high' };
      
      await expect(taskService.createTask(invalidTask))
        .rejects
        .toThrow(ApiError);
    });
  });

  describe('getTaskById', () => {
    it('should return task by id', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask as any);

      const result = await taskService.getTaskById('123');
      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw not found error for non-existent task', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(taskService.getTaskById('123'))
        .rejects
        .toThrow(new ApiError(404, 'Task not found'));
    });
  });

  describe('updateTask', () => {
    const updateData = { title: 'Updated Title' };

    it('should update task successfully', async () => {
      const updatedTask = { ...mockTask, ...updateData };
      mockTaskRepository.update.mockResolvedValue(updatedTask as any);

      const result = await taskService.updateTask('123', updateData);
      expect(result).toEqual(updatedTask);
      expect(mockTaskRepository.update).toHaveBeenCalledWith('123', updateData);
    });

    it('should throw not found error for non-existent task', async () => {
      mockTaskRepository.update.mockResolvedValue(null);

      await expect(taskService.updateTask('123', updateData))
        .rejects
        .toThrow(new ApiError(404, 'Task not found'));
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockTaskRepository.delete.mockResolvedValue(mockTask as any);

      const result = await taskService.deleteTask('123');
      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw not found error for non-existent task', async () => {
      mockTaskRepository.delete.mockResolvedValue(null);

      await expect(taskService.deleteTask('123'))
        .rejects
        .toThrow(new ApiError(404, 'Task not found'));
    });
  });

  describe('getTasks', () => {
    it('should return filtered tasks', async () => {
      const filter = { status: 'todo' };
      mockTaskRepository.findAll.mockResolvedValue([mockTask] as any);

      const result = await taskService.getTasks(filter);
      expect(result).toEqual([mockTask]);
      expect(mockTaskRepository.findAll).toHaveBeenCalledWith(filter);
    });
  });

  describe('getUserTasks', () => {
    it('should return user tasks', async () => {
      mockTaskRepository.findUserTasks.mockResolvedValue([mockTask] as any);

      const result = await taskService.getUserTasks('userId');
      expect(result).toEqual([mockTask]);
      expect(mockTaskRepository.findUserTasks).toHaveBeenCalledWith('userId');
    });
  });
});