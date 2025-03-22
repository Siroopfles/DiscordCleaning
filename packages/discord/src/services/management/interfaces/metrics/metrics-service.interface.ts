import { Counter, Gauge, Histogram, Summary } from 'prom-client';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type NonNullableRecord<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type MetricLabels = NonNullableRecord<Record<string, string | number>>;

export interface MetricValue {
  value: number;
  labels?: MetricLabels;
}

export interface MetricOptions {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface IMetricsService {
  // Counter operations
  createCounter(options: MetricOptions): Counter<string>;
  incrementCounter(name: string, labels?: MetricLabels): void;
  
  // Gauge operations
  createGauge(options: MetricOptions): Gauge<string>;
  setGauge(name: string, value: number, labels?: MetricLabels): void;
  incrementGauge(name: string, value?: number, labels?: MetricLabels): void;
  decrementGauge(name: string, value?: number, labels?: MetricLabels): void;
  
  // Histogram operations
  createHistogram(options: MetricOptions & { buckets?: number[] }): Histogram<string>;
  observeHistogram(name: string, value: number, labels?: MetricLabels): void;
  
  // Summary operations
  createSummary(options: MetricOptions & { percentiles?: number[] }): Summary<string>;
  observeSummary(name: string, value: number, labels?: MetricLabels): void;
  
  // Metric management
  getMetric(name: string): Counter<string> | Gauge<string> | Histogram<string> | Summary<string> | undefined;
  removeMetric(name: string): void;
  clearMetrics(): void;
  
  // Prometheus specific
  getMetricsContentType(): string;
  getMetrics(): Promise<string>;
}