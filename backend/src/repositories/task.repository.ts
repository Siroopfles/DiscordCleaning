import { Task, TaskDocument } from '../models/Task';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { ITask } from '../types/models';

export class TaskRepository {
  async create(taskData: Omit<ITask, 'created_at' | 'updated_at'>): Promise<TaskDocument> {
    const task = new Task(taskData);
    return await task.save();
  }

  async findById(id: string): Promise<TaskDocument | null> {
    return await Task.findById(id);
  }

  async findAll(filter: FilterQuery<TaskDocument> = {}): Promise<TaskDocument[]> {
    return await Task.find(filter)
      .sort({ created_at: -1 })
      .populate('category', 'name color')
      .populate('created_by', 'username')
      .populate('assigned_to', 'username');
  }

  async update(id: string, updateData: UpdateQuery<TaskDocument>): Promise<TaskDocument | null> {
    return await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name color')
     .populate('created_by', 'username')
     .populate('assigned_to', 'username');
  }

  async delete(id: string): Promise<TaskDocument | null> {
    return await Task.findByIdAndDelete(id);
  }

  async findByFilter(filter: FilterQuery<TaskDocument>): Promise<TaskDocument[]> {
    return await Task.find(filter)
      .sort({ created_at: -1 })
      .populate('category', 'name color')
      .populate('created_by', 'username')
      .populate('assigned_to', 'username');
  }

  async findUserTasks(userId: string): Promise<TaskDocument[]> {
    return await Task.find({
      $or: [{ created_by: userId }, { assigned_to: userId }]
    })
    .sort({ due_date: 1, priority: -1 })
    .populate('category', 'name color')
    .populate('created_by', 'username')
    .populate('assigned_to', 'username');
  }
}

export const taskRepository = new TaskRepository();