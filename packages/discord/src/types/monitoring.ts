import { Gauge, Counter, Registry } from 'prom-client';
import { Logger } from '.';

export interface MetricsRegistry {
  registry: Registry;
  metrics: {
    currencyOperations: Counter<string>;
    rateLimitAttempts: Counter<string>;
    activeUsers: Gauge<string>;
    commandLatency: Gauge<string>;
    eventLatency: Gauge<string>;
  };
}

export interface MonitoringOptions {
  logger?: Logger;
  metricsEnabled?: boolean;
  metricsPrefix?: string;
  logLevel?: LogLevel;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface MonitoringEvent {
  category: string;
  action: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  commandLatencies: Map<string, number[]>;
  eventLatencies: Map<string, number[]>;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
}

export interface MetricsExporter {
  registry: Registry;
  getMetricsAsString(): Promise<string>;
}

export interface LoggerConfig {
  level: LogLevel;
  format?: 'json' | 'simple';
  timestamp?: boolean;
  colorize?: boolean;
  transports?: {
    console?: boolean;
    file?: {
      filename: string;
      maxSize?: number;
      maxFiles?: number;
    };
  };
}