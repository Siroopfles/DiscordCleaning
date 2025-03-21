import { Types, PipelineStage } from 'mongoose';
import { BaseRepository } from './base.repository';
import { AnalyticsData, IAnalyticsData } from '../models/AnalyticsData';

export class AnalyticsRepository extends BaseRepository<IAnalyticsData> {
  constructor() {
    super(AnalyticsData);
  }

  /**
   * Haalt analytics data op voor een specifieke server en timeframe
   */
  async getServerAnalytics(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<IAnalyticsData[]> {
    return this.model.find({
      serverId: new Types.ObjectId(serverId),
      timeframe,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).exec();
  }

  /**
   * Haalt de meest recente analytics data op voor een server
   */
  async getLatestAnalytics(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly'
  ): Promise<IAnalyticsData | null> {
    return this.model.findOne({
      serverId: new Types.ObjectId(serverId),
      timeframe
    }).sort({ date: -1 }).exec();
  }

  /**
   * Slaat nieuwe analytics data op
   */
  async saveAnalytics(data: Partial<IAnalyticsData>): Promise<IAnalyticsData> {
    return this.create(data);
  }

  /**
   * Update of creëer analytics data voor een specifieke periode
   */
  async upsertAnalytics(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    date: Date,
    metrics: IAnalyticsData['metrics']
  ): Promise<IAnalyticsData> {
    const update = {
      $set: {
        metrics,
        aggregatedAt: new Date()
      }
    };

    return this.model.findOneAndUpdate(
      {
        serverId: new Types.ObjectId(serverId),
        timeframe,
        date
      },
      update,
      {
        new: true,
        upsert: true
      }
    ).exec();
  }

  /**
   * Haalt trend data op voor een specifieke metric
   */
  async getMetricTrend(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    metricPath: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<Array<{ date: Date; value: number }>> {
    const aggregation: PipelineStage[] = [
      {
        $match: {
          serverId: new Types.ObjectId(serverId),
          timeframe,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $project: {
          date: 1,
          value: `$metrics.${metricPath}`
        }
      },
      {
        $sort: { date: -1 } as const
      }
    ];

    if (limit) {
      aggregation.push({ $limit: limit } as PipelineStage);
    }

    return this.model.aggregate(aggregation);
  }

  /**
   * Haalt vergelijkende statistieken op tussen periodes
   */
  async getComparativeStats(
    serverId: string,
    timeframe: 'daily' | 'weekly' | 'monthly',
    currentPeriodStart: Date,
    previousPeriodStart: Date,
    metricPaths: string[]
  ): Promise<{
    current: Record<string, number>;
    previous: Record<string, number>;
    changes: Record<string, number>;
  }> {
    const currentPeriodEnd = new Date(currentPeriodStart);
    const previousPeriodEnd = new Date(previousPeriodStart);

    // Bereken periode einde gebaseerd op timeframe
    switch (timeframe) {
      case 'daily':
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() + 1);
        break;
      case 'weekly':
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() + 7);
        break;
      case 'monthly':
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() + 1);
        break;
    }

    const [currentData, previousData] = await Promise.all([
      this.model.findOne({
        serverId: new Types.ObjectId(serverId),
        timeframe,
        date: {
          $gte: currentPeriodStart,
          $lt: currentPeriodEnd
        }
      }).exec(),
      this.model.findOne({
        serverId: new Types.ObjectId(serverId),
        timeframe,
        date: {
          $gte: previousPeriodStart,
          $lt: previousPeriodEnd
        }
      }).exec()
    ]);

    const result: {
      current: Record<string, number>;
      previous: Record<string, number>;
      changes: Record<string, number>;
    } = {
      current: {},
      previous: {},
      changes: {}
    };

    for (const path of metricPaths) {
      const currentValue = this.getValueByPath(currentData?.metrics, path) || 0;
      const previousValue = this.getValueByPath(previousData?.metrics, path) || 0;
      
      result.current[path] = currentValue;
      result.previous[path] = previousValue;
      result.changes[path] = previousValue ? 
        ((currentValue - previousValue) / previousValue) * 100 : 
        100;
    }

    return result;
  }

  /**
   * Helper functie om een waarde op te halen via een punt-genoteerde path
   */
  private getValueByPath(obj: any, path: string): number {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) || 0;
  }
}