import { Types } from 'mongoose';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { TaskHistoryRepository } from '../repositories/TaskHistoryRepository';
import { IAnalyticsData } from '../models/AnalyticsData';
import { ApiError } from '../utils/ApiError';

export class AnalyticsService {
  private analyticsRepository: AnalyticsRepository;
  private historyRepository: TaskHistoryRepository;

  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
    this.historyRepository = new TaskHistoryRepository();
  }

  /**
   * Genereert en slaat analytics data op voor een specifieke periode
   */
  async generateAnalytics(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    date: Date
  ): Promise<IAnalyticsData> {
    try {
      const periodEnd = this.calculatePeriodEnd(date, timeframe);
      
      // Haal geschiedenis data op voor de periode
      const historyStats = await this.historyRepository.getHistoryStats(serverId, date, periodEnd);
      
      // Bereken metrics
      const metrics = {
        totalTasks: historyStats.totalActions,
        completedTasks: historyStats.actionsByType['completed'] || 0,
        averageCompletionTime: await this.calculateAverageCompletionTime(serverId, date, periodEnd),
        tasksByCategory: await this.aggregateTasksByCategory(serverId, date, periodEnd),
        tasksByUser: await this.aggregateTasksByUser(serverId, date, periodEnd),
        tasksByPriority: await this.aggregateTasksByPriority(serverId, date, periodEnd)
      };

      // Sla analytics op
      return await this.analyticsRepository.upsertAnalytics(
        serverId,
        timeframe,
        date,
        metrics
      );
    } catch (error) {
      throw new ApiError(500, 'Fout bij het genereren van analytics');
    }
  }

  /**
   * Haalt analytics op voor een specifieke periode
   */
  async getAnalytics(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<IAnalyticsData[]> {
    try {
      return await this.analyticsRepository.getServerAnalytics(
        serverId,
        timeframe,
        startDate,
        endDate
      );
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van analytics');
    }
  }

  /**
   * Haalt trends op voor specifieke metrics
   */
  async getMetricTrends(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    metrics: string[],
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<Record<string, Array<{ date: Date; value: number }>>> {
    try {
      const trends: Record<string, Array<{ date: Date; value: number }>> = {};

      await Promise.all(
        metrics.map(async (metric) => {
          trends[metric] = await this.analyticsRepository.getMetricTrend(
            serverId,
            timeframe,
            metric,
            startDate,
            endDate,
            limit
          );
        })
      );

      return trends;
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van metric trends');
    }
  }

  /**
   * Haalt vergelijkende statistieken op
   */
  async getComparativeStats(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    currentPeriodStart: Date,
    metrics: string[]
  ): Promise<{
    current: Record<string, number>;
    previous: Record<string, number>;
    changes: Record<string, number>;
  }> {
    try {
      const previousPeriodStart = this.calculatePreviousPeriodStart(
        currentPeriodStart,
        timeframe
      );

      return await this.analyticsRepository.getComparativeStats(
        serverId,
        timeframe,
        currentPeriodStart,
        previousPeriodStart,
        metrics
      );
    } catch (error) {
      throw new ApiError(500, 'Fout bij het ophalen van vergelijkende statistieken');
    }
  }

  /**
   * Helper functies voor periode berekeningen
   */
  private calculatePeriodEnd(date: Date, timeframe: 'daily' | 'weekly' | 'monthly'): Date {
    const end = new Date(date);
    switch (timeframe) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
    }
    return end;
  }

  private calculatePreviousPeriodStart(date: Date, timeframe: 'daily' | 'weekly' | 'monthly'): Date {
    const start = new Date(date);
    switch (timeframe) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  /**
   * Helper functies voor data aggregatie
   */
  private async calculateAverageCompletionTime(
    serverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const history = await this.historyRepository.getServerHistory(
      serverId,
      startDate,
      endDate
    );

    const completedTasks = history.filter(h => h.action === 'completed' && h.metadata?.completionTime);
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce(
      (sum, h) => sum + (h.metadata?.completionTime || 0),
      0
    );

    return Math.round(totalTime / completedTasks.length);
  }

  private async aggregateTasksByCategory(
    serverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ categoryId: Types.ObjectId; count: number; completedCount: number }>> {
    const history = await this.historyRepository.getServerHistory(serverId, startDate, endDate);
    const categoryStats = new Map<string, { count: number; completedCount: number }>();

    history.forEach(h => {
      const categoryId = h.metadata?.categoryId?.toString();
      if (!categoryId) return;

      const stats = categoryStats.get(categoryId) || { count: 0, completedCount: 0 };
      if (h.action === 'created') stats.count++;
      if (h.action === 'completed') stats.completedCount++;
      categoryStats.set(categoryId, stats);
    });

    return Array.from(categoryStats.entries()).map(([categoryId, stats]) => ({
      categoryId: new Types.ObjectId(categoryId),
      count: stats.count,
      completedCount: stats.completedCount
    }));
  }

  private async aggregateTasksByUser(
    serverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    userId: Types.ObjectId;
    count: number;
    completedCount: number;
    averageCompletionTime: number;
  }>> {
    const history = await this.historyRepository.getServerHistory(serverId, startDate, endDate);
    const userStats = new Map<string, {
      count: number;
      completedCount: number;
      completionTimes: number[];
    }>();

    history.forEach(h => {
      const userId = h.userId.toString();
      const stats = userStats.get(userId) || {
        count: 0,
        completedCount: 0,
        completionTimes: []
      };

      if (h.action === 'created') stats.count++;
      if (h.action === 'completed') {
        stats.completedCount++;
        if (h.metadata?.completionTime) {
          stats.completionTimes.push(h.metadata.completionTime);
        }
      }

      userStats.set(userId, stats);
    });

    return Array.from(userStats.entries()).map(([userId, stats]) => ({
      userId: new Types.ObjectId(userId),
      count: stats.count,
      completedCount: stats.completedCount,
      averageCompletionTime: stats.completionTimes.length > 0
        ? Math.round(stats.completionTimes.reduce((a, b) => a + b, 0) / stats.completionTimes.length)
        : 0
    }));
  }

  private async aggregateTasksByPriority(
    serverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ high: number; medium: number; low: number }> {
    const history = await this.historyRepository.getServerHistory(serverId, startDate, endDate);
    const stats = { high: 0, medium: 0, low: 0 };

    history.forEach(h => {
      if (h.action === 'created' && h.metadata?.priority) {
        const priority = h.metadata.priority.toLowerCase();
        if (priority in stats) {
          stats[priority as keyof typeof stats]++;
        }
      }
    });

    return stats;
  }
}