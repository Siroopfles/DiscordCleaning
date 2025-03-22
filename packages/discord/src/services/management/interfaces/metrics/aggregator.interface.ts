import { MetricBatch } from './collector.interface';
import { MetricLabels } from './metrics-service.interface';

export interface AggregationResult {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels?: MetricLabels;
}

export interface AggregationOptions {
  windowSizeMs?: number;
  aggregationInterval?: number;
  customReducers?: {
    [key: string]: (values: number[]) => number;
  };
}

export interface IMetricsAggregator {
  // Aggregation methods
  aggregate(metrics: MetricBatch[]): Promise<AggregationResult[]>;
  
  // Window management
  addToWindow(metric: MetricBatch): void;
  clearWindow(): void;
  
  // Configuration
  setAggregationOptions(options: AggregationOptions): void;
  
  // Custom reducers
  registerReducer(name: string, reducer: (values: number[]) => number): void;
  removeReducer(name: string): void;
  
  // Lifecycle methods
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Event handlers
  onWindowComplete?: (results: AggregationResult[]) => Promise<void>;
  onError?: (error: Error) => void;
}