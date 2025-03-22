import { Registry } from 'prom-client';
import { DiscordClient } from '../../../../types';
import { IMetricsService } from '../../interfaces/metrics/metrics-service.interface';
import { IMetricsCollector } from '../../interfaces/metrics/collector.interface';
import { IMetricsAggregator } from '../../interfaces/metrics/aggregator.interface';
import { IMetricsExporter } from '../../interfaces/metrics/exporter.interface';
import { PrometheusAdapter } from './prometheus.adapter';
import { MetricsCollector } from './metrics-collector';
import { MetricsAggregator } from './metrics-aggregator';
import { PrometheusExporter } from './prometheus-exporter';

export interface MetricsFactoryOptions {
  // Collector options
  batchSize?: number;
  flushInterval?: number;
  
  // Aggregator options
  windowSize?: number;
  aggregationInterval?: number;
  
  // Prometheus options
  prefix?: string;
  defaultLabels?: Record<string, string>;
  registry?: Registry;
}

export class MetricsFactory {
  constructor(private readonly client: DiscordClient) {}

  public createMetricsService(options: MetricsFactoryOptions = {}): IMetricsService {
    // Create and configure collector
    const collector = this.createCollector({
      maxSize: options.batchSize,
      flushIntervalMs: options.flushInterval
    });

    // Create and configure aggregator
    const aggregator = this.createAggregator({
      windowSizeMs: options.windowSize,
      aggregationInterval: options.aggregationInterval
    });

    // Create and configure exporter
    const exporter = this.createExporter({
      prefix: options.prefix,
      defaultLabels: options.defaultLabels,
      registry: options.registry
    });

    // Create metrics service with all dependencies
    return new PrometheusAdapter(
      this.client,
      collector,
      aggregator,
      exporter
    );
  }

  private createCollector(options: { maxSize?: number; flushIntervalMs?: number }): IMetricsCollector {
    return new MetricsCollector(this.client, {
      maxSize: options.maxSize || 1000,
      flushIntervalMs: options.flushIntervalMs || 10000
    });
  }

  private createAggregator(options: { windowSizeMs?: number; aggregationInterval?: number }): IMetricsAggregator {
    return new MetricsAggregator(this.client, {
      windowSizeMs: options.windowSizeMs || 60000,
      aggregationInterval: options.aggregationInterval || 15000
    });
  }

  private createExporter(options: { prefix?: string; defaultLabels?: Record<string, string>; registry?: Registry }): IMetricsExporter {
    return new PrometheusExporter({
      prefix: options.prefix,
      defaultLabels: options.defaultLabels,
      registry: options.registry
    });
  }
}