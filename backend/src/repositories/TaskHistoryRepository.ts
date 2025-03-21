import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { TaskHistory, ITaskHistory } from '../models/TaskHistory';

export class TaskHistoryRepository extends BaseRepository<ITaskHistory> {
  constructor() {
    super(TaskHistory);
  }

  /**
   * Haalt taakgeschiedenis op voor een specifieke taak
   */
  async getTaskHistory(taskId: string, limit?: number): Promise<ITaskHistory[]> {
    const query = this.model.find({ taskId: new Types.ObjectId(taskId) })
      .sort({ timestamp: -1 });

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  /**
   * Haalt taakgeschiedenis op voor een specifieke server
   */
  async getServerHistory(
    serverId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<ITaskHistory[]> {
    const query: any = { serverId: new Types.ObjectId(serverId) };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const baseQuery = this.model.find(query).sort({ timestamp: -1 });

    if (limit) {
      baseQuery.limit(limit);
    }

    return baseQuery.exec();
  }

  /**
   * Haalt taakgeschiedenis op voor een specifieke gebruiker
   */
  async getUserHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<ITaskHistory[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const baseQuery = this.model.find(query).sort({ timestamp: -1 });

    if (limit) {
      baseQuery.limit(limit);
    }

    return baseQuery.exec();
  }

  /**
   * Voegt een nieuwe taakgeschiedenis entry toe
   */
  async createHistoryEntry(data: Partial<ITaskHistory>): Promise<ITaskHistory> {
    return this.create(data);
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
    const pipeline = [
      {
        $match: {
          serverId: new Types.ObjectId(serverId),
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $facet: {
          totalActions: [{ $count: 'count' }],
          actionsByType: [
            { $group: { _id: '$action', count: { $sum: 1 } } }
          ],
          userActions: [
            { $group: { _id: '$userId', count: { $sum: 1 } } }
          ]
        }
      }
    ];

    const [result] = await this.model.aggregate(pipeline);
    
    return {
      totalActions: result.totalActions[0]?.count || 0,
      actionsByType: result.actionsByType.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      userActions: result.userActions.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr._id.toString()] = curr.count;
        return acc;
      }, {})
    };
  }
}