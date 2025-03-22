import { IMetricsAggregator, AggregationResult, AggregationOptions } from '../../interfaces/metrics/aggregator.interface';
import { MetricBatch } from '../../interfaces/metrics/collector.interface';
import { MetricLabels, MetricType } from '../../interfaces/metrics/metrics-service.interface';
import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';

interface AggregationWindow {
  metrics: Map<string, {
    type: MetricType;
    values: number[];
    labels: Set<string>;
  }>;
  startTime: number;
}

export class MetricsAggregator extends BaseService implements IMetricsAggregator {
  private currentWindow: AggregationWindow;
  private aggregationInterval: NodeJS.Timeout | null = null;
  private options: Required<AggregationOptions> = {
    windowSizeMs: 60000, // 1 minute
    aggregationInterval: 15000, // 15 seconds
    customReducers: {}
  };

  // Event handlers
  public onWindowComplete?: (results: AggregationResult[]) => Promise<void>;
  public onError?: (error: Error) => void;

  constructor(
    client: DiscordClient,
    options?: AggregationOptions
  ) {
    super(client);
    this.currentWindow = this.createNewWindow();
    if (options) {
      this.setAggregationOptions(options);
    }
  }

  protected async initialize(): Promise<void> {
    await this.start();
  }

  public async aggregate(metrics: MetricBatch[]): Promise<AggregationResult[]> {
    try {
      // Group metrics by name and type
      const grouped = this.groupMetrics(metrics);
      
      // Apply reducers to each group
      return this.applyReducers(grouped);
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  public addToWindow(metric: MetricBatch): void {
    try {
      const { name, type, value, labels } = metric;
      const key = this.getMetricKey(name, labels);
      
      let metricData = this.currentWindow.metrics.get(key);
      if (!metricData) {
        metricData = { type, values: [], labels: new Set() };
        this.currentWindow.metrics.set(key, metricData);
      }

      metricData.values.push(value);
      if (labels) {
        Object.entries(labels).forEach(([k, v]) => {
          metricData!.labels.add(`${k}=${v}`);
        });
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public clearWindow(): void {
    this.currentWindow = this.createNewWindow();
  }

  public setAggregationOptions(options: AggregationOptions): void {
    this.options = {
      windowSizeMs: options.windowSizeMs ?? this.options.windowSizeMs,
      aggregationInterval: options.aggregationInterval ?? this.options.aggregationInterval,
      customReducers: { ...this.options.customReducers, ...options.customReducers }
    };

    // Reset interval if running
    if (this.aggregationInterval) {
      this.resetAggregationInterval();
    }
  }

  public registerReducer(name: string, reducer: (values: number[]) => number): void {
    this.options.customReducers[name] = reducer;
  }

  public removeReducer(name: string): void {
    delete this.options.customReducers[name];
  }

  public async start(): Promise<void> {
    this.setupAggregationInterval();
  }

  public async stop(): Promise<void> {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }

    // Final aggregation
    const results = await this.processCurrentWindow();
    if (results.length > 0 && this.onWindowComplete) {
      await this.onWindowComplete(results);
    }
  }

  private createNewWindow(): AggregationWindow {
    return {
      metrics: new Map(),
      startTime: Date.now()
    };
  }

  private getMetricKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    
    // Filter out any undefined or null values
    const validLabels = Object.entries(labels).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) {
        acc[k] = v;
      }
      return acc;
    }, {} as MetricLabels);
    
    const labelStr = Object.entries(validLabels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  private groupMetrics(metrics: MetricBatch[]): Map<string, MetricBatch[]> {
    return metrics.reduce((groups, metric) => {
      const key = this.getMetricKey(metric.name, metric.labels);
      const group = groups.get(key) || [];
      group.push(metric);
      groups.set(key, group);
      return groups;
    }, new Map<string, MetricBatch[]>());
  }

  private applyReducers(grouped: Map<string, MetricBatch[]>): AggregationResult[] {
    const results: AggregationResult[] = [];

    for (const [key, metrics] of grouped) {
      if (metrics.length === 0) continue;

      const { name, type, labels } = metrics[0];
      const values = metrics.map(m => m.value);

      const value = this.reduceValues(type, values);
      
      results.push({
        name,
        type,
        value,
        labels
      });
    }

    return results;
  }

  private reduceValues(type: string, values: number[]): number {
    if (values.length === 0) return 0;

    switch (type) {
      case 'counter':
        return values.reduce((sum, v) => sum + v, 0);
      case 'gauge':
        return values[values.length - 1];
      case 'histogram':
      case 'summary':
        return this.calculatePercentiles(values)[0.95]; // 95th percentile
      default:
        if (this.options.customReducers[type]) {
          return this.options.customReducers[type](values);
        }
        return values[values.length - 1];
    }
  }

  private calculatePercentiles(values: number[]): { [percentile: number]: number } {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      0.5: sorted[Math.floor(sorted.length * 0.5)],
      0.75: sorted[Math.floor(sorted.length * 0.75)],
      0.95: sorted[Math.floor(sorted.length * 0.95)],
      0.99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  private async processCurrentWindow(): Promise<AggregationResult[]> {
    const windowAge = Date.now() - this.currentWindow.startTime;
    if (windowAge >= this.options.windowSizeMs) {
      const results: AggregationResult[] = [];
      
      for (const [key, data] of this.currentWindow.metrics) {
        const [name] = key.split('{');
        const value = this.reduceValues(data.type, data.values);
        
        results.push({
          name,
          type: data.type,
          value,
          labels: Array.from(data.labels).reduce((obj, label) => {
            const [k, v] = label.split('=');
            obj[k] = v;
            return obj;
          }, {} as Record<string, string>)
        });
      }

      this.clearWindow();
      return results;
    }

    return [];
  }

  private handleError(error: Error): void {
    this.log('error', 'Metrics aggregator error:', error);
    
    if (this.onError) {
      this.onError(error);
    }
  }

  private setupAggregationInterval(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }

    this.aggregationInterval = setInterval(async () => {
      try {
        const results = await this.processCurrentWindow();
        if (results.length > 0 && this.onWindowComplete) {
          await this.onWindowComplete(results);
        }
      } catch (error) {
        this.handleError(error as Error);
      }
    }, this.options.aggregationInterval);

    // Prevent interval from keeping the process alive
    if (this.aggregationInterval.unref) {
      this.aggregationInterval.unref();
    }
  }

  private resetAggregationInterval(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.setupAggregationInterval();
    }
  }
}