import { z } from 'zod';
import { TaskRepository, taskRepository } from '../repositories/task.repository';
import { FilterQuery } from 'mongoose';
import { TaskDocument } from '../models/Task';
import { ApiError } from '../utils/ApiError';

// Validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'completed']),
  created_by: z.string(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});

export const updateTaskSchema = createTaskSchema.partial();

export class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async createTask(data: z.infer<typeof createTaskSchema>) {
    try {
      const validatedData = createTaskSchema.parse(data);
      return await this.taskRepository.create(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(400, 'Validation error', error.errors);
      }
      if (error instanceof Error) {
        throw new ApiError(500, error.message);
      }
      throw error;
    }
  }

  async getTaskById(id: string) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    return task;
  }

  async getTasks(filters: FilterQuery<TaskDocument> = {}) {
    return await this.taskRepository.findAll(filters);
  }

  async updateTask(id: string, data: z.infer<typeof updateTaskSchema>) {
    try {
      const validatedData = updateTaskSchema.parse(data);
      const updatedTask = await this.taskRepository.update(id, validatedData);
      if (!updatedTask) {
        throw new ApiError(404, 'Task not found');
      }
      return updatedTask;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(400, 'Validation error', error.errors);
      }
      if (error instanceof Error) {
        throw new ApiError(500, error.message);
      }
      throw error;
    }
  }

  async deleteTask(id: string) {
    const task = await this.taskRepository.delete(id);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    return task;
  }

  async getUserTasks(userId: string) {
    return await this.taskRepository.findUserTasks(userId);
  }

  async getTasksByFilter(filter: FilterQuery<TaskDocument>) {
    return await this.taskRepository.findByFilter(filter);
  }
}

export const taskService = new TaskService(taskRepository);