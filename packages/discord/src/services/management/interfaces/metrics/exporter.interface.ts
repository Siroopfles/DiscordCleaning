import { Registry } from 'prom-client';
import { AggregationResult } from './aggregator.interface';

export interface ExporterOptions {
  prefix?: string;
  defaultLabels?: Record<string, string>;
  registry?: Registry;
}

export interface IMetricsExporter {
  // Registry management
  getRegistry(): Registry;
  clearRegistry(): void;
  
  // Metric registration
  registerMetric(result: AggregationResult): Promise<void>;
  registerMetrics(results: AggregationResult[]): Promise<void>;
  
  // Prometheus format
  getMetricsContentType(): string;
  getMetrics(): Promise<string>;
  
  // Configuration
  setOptions(options: ExporterOptions): void;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // Health check
  isHealthy(): boolean;
  
  // Event handlers
  onExportError?: (error: Error) => void;
  onMetricsRequested?: () => Promise<void>;
}