export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}

export interface MetricDefinition {
  name: string;
  help: string;
  type: MetricType;
  labelNames: string[];
  buckets?: number[]; // Only for histogram type
}

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricExport {
  name: string;
  help: string;
  type: MetricType;
  values: MetricValue[];
}