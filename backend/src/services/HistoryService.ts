import { Types } from 'mongoose';
import { TaskHistoryRepository } from '../repositories/TaskHistoryRepository';
import { ITaskHistory } from '../models/TaskHistory';
import { ApiError } from '../utils/ApiError';

export class HistoryService {
  private historyRepository: TaskHistoryRepository;

  constructor() {
    this.historyRepository = new TaskHistoryRepository();
  }

  /**
   * Voegt een nieuwe geschiedenis entry toe
   */
  async addHistoryEntry(data: {
    taskId: string;
    userId: string;
    serverId: string;
    action: 'created' | 'updated' | 'completed' | 'deleted';
    previousState?: any;
    newState?: any;
    metadata?: {
      completionTime?: number;
      categoryId?: string;
      priority?: string;
      assignedTo?: string;
    };
  }): Promise<ITaskHistory> {
    try {
      const historyData: Partial<ITaskHistory> = {
        taskId: new Types.ObjectId(data.taskId),
        userId: new Types.ObjectId(data.userId),
        serverId: new Types.ObjectId(data.serverId),
        action: data.action,
        previousState: data.previousState,
        newState: data.newState,
        metadata: {
          ...data.metadata,
          categoryId: data.metadata?.categoryId ? new Types.ObjectId(data.metadata.categoryId) : undefined,
          assignedTo: data.metadata?.assignedTo ? new Types.ObjectId(data.metadata.assignedTo) : undefined
        }
      };

      return await this.historyRepository.createHistoryEntry(historyData);
    } catch (error) {
      throw new ApiError(500, 'Fout bij het toevoegen van geschiedenis entry');
    }
  }

  /**
   * Haalt geschiedenis op voor een specifieke taak
   */
  async getTaskHistory(taskId: string, limit?: number): Promise<ITaskHistory[]> {
    try {
      return await this.historyRepository.getTaskHistory(taskId, limit);
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van taakgeschiedenis');
    }
  }

  /**
   * Haalt geschiedenis op voor een specifieke server
   */
  async getServerHistory(
    serverId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<ITaskHistory[]> {
    try {
      return await this.historyRepository.getServerHistory(
        serverId,
        options.startDate,
        options.endDate,
        options.limit
      );
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van servergeschiedenis');
    }
  }

  /**
   * Haalt geschiedenis op voor een specifieke gebruiker
   */
  async getUserHistory(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<ITaskHistory[]> {
    try {
      return await this.historyRepository.getUserHistory(
        userId,
        options.startDate,
        options.endDate,
        options.limit
      );
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van gebruikersgeschiedenis');
    }
  }

  /**
   * Haalt statistieken op voor een specifieke periode
   */
  async getHistoryStats(
    serverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    userActions: Record<string, number>;
  }> {
    try {
      return await this.historyRepository.getHistoryStats(serverId, startDate, endDate);
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van geschiedenis statistieken');
    }
  }
}