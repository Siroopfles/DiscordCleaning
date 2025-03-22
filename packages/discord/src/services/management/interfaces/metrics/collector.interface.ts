import { MetricLabels } from './metrics-service.interface';

export interface MetricBatch {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  timestamp: number;
  labels?: MetricLabels;
}

export interface BatchOptions {
  maxSize?: number;
  flushIntervalMs?: number;
}

export interface IMetricsCollector {
  // Batch collection methods
  addToBatch(metric: MetricBatch): void;
  flush(): Promise<void>;
  
  // Batch configuration
  setBatchOptions(options: BatchOptions): void;
  
  // Lifecycle methods
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Event handlers
  onBatchFull?: (batch: MetricBatch[]) => Promise<void>;
  onBatchFlush?: (batch: MetricBatch[]) => Promise<void>;
  onError?: (error: Error) => void;
}