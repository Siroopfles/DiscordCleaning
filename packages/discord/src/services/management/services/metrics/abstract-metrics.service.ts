import { BaseService } from '../../../base.service';
import { IMetricsService, MetricLabels, MetricOptions } from '../../interfaces/metrics/metrics-service.interface';
import { Counter, Gauge, Histogram, Summary } from 'prom-client';
import { IMetricsCollector } from '../../interfaces/metrics/collector.interface';
import { IMetricsAggregator } from '../../interfaces/metrics/aggregator.interface';
import { IMetricsExporter } from '../../interfaces/metrics/exporter.interface';

export abstract class AbstractMetricsService extends BaseService implements IMetricsService {
  protected readonly collector: IMetricsCollector;
  protected readonly aggregator: IMetricsAggregator;
  protected readonly exporter: IMetricsExporter;
  protected readonly metrics: Map<string, Counter<string> | Gauge<string> | Histogram<string> | Summary<string>>;

  constructor(
    client: any,
    collector: IMetricsCollector,
    aggregator: IMetricsAggregator,
    exporter: IMetricsExporter
  ) {
    super(client);
    this.collector = collector;
    this.aggregator = aggregator;
    this.exporter = exporter;
    this.metrics = new Map();
  }

  protected async initialize(): Promise<void> {
    await this.collector.start();
    await this.aggregator.start();
    await this.exporter.initialize();

    // Set up collector event handlers
    this.collector.onBatchFull = async (batch) => {
      const results = await this.aggregator.aggregate(batch);
      await this.exporter.registerMetrics(results);
    };

    this.collector.onError = (error) => {
      this.log('error', 'Metrics collector error:', error);
    };

    // Set up aggregator event handlers
    this.aggregator.onError = (error) => {
      this.log('error', 'Metrics aggregator error:', error);
    };

    // Set up exporter event handlers
    this.exporter.onExportError = (error) => {
      this.log('error', 'Metrics export error:', error);
    };
  }

  public createCounter(options: MetricOptions): Counter<string> {
    const counter = new Counter({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || []
    });
    this.metrics.set(options.name, counter);
    return counter;
  }

  public incrementCounter(name: string, labels?: MetricLabels): void {
    const metric = this.metrics.get(name) as Counter<string>;
    if (!metric || !(metric instanceof Counter)) {
      throw new Error(`Counter ${name} not found or invalid type`);
    }
    if (labels) {
      metric.inc(labels);
    } else {
      metric.inc();
    }
    this.collector.addToBatch({
      name,
      type: 'counter',
      value: 1,
      timestamp: Date.now(),
      labels
    });
  }

  public createGauge(options: MetricOptions): Gauge<string> {
    const gauge = new Gauge({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || []
    });
    this.metrics.set(options.name, gauge);
    return gauge;
  }

  public setGauge(name: string, value: number, labels?: MetricLabels): void {
    const metric = this.metrics.get(name) as Gauge<string>;
    if (!metric || !(metric instanceof Gauge)) {
      throw new Error(`Gauge ${name} not found or invalid type`);
    }
    if (labels) {
      metric.set(labels, value);
    } else {
      metric.set(value);
    }
    this.collector.addToBatch({
      name,
      type: 'gauge',
      value,
      timestamp: Date.now(),
      labels
    });
  }

  public incrementGauge(name: string, value: number = 1, labels?: MetricLabels): void {
    const metric = this.metrics.get(name) as Gauge<string>;
    if (!metric || !(metric instanceof Gauge)) {
      throw new Error(`Gauge ${name} not found or invalid type`);
    }
    if (labels) {
      metric.inc(labels, value);
    } else {
      metric.inc(value);
    }
    this.collector.addToBatch({
      name,
      type: 'gauge',
      value,
      timestamp: Date.now(),
      labels
    });
  }

  public decrementGauge(name: string, value: number = 1, labels?: MetricLabels): void {
    const metric = this.metrics.get(name) as Gauge<string>;
    if (!metric || !(metric instanceof Gauge)) {
      throw new Error(`Gauge ${name} not found or invalid type`);
    }
    if (labels) {
      metric.dec(labels, value);
    } else {
      metric.dec(value);
    }
    this.collector.addToBatch({
      name,
      type: 'gauge',
      value: -value,
      timestamp: Date.now(),
      labels
    });
  }

  public createHistogram(options: MetricOptions & { buckets?: number[] }): Histogram<string> {
    const histogram = new Histogram({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      buckets: options.buckets
    });
    this.metrics.set(options.name, histogram);
    return histogram;
  }

  public observeHistogram(name: string, value: number, labels?: MetricLabels): void {
    const metric = this.metrics.get(name) as Histogram<string>;
    if (!metric || !(metric instanceof Histogram)) {
      throw new Error(`Histogram ${name} not found or invalid type`);
    }
    if (labels) {
      metric.observe(labels, value);
    } else {
      metric.observe(value);
    }
    this.collector.addToBatch({
      name,
      type: 'histogram',
      value,
      timestamp: Date.now(),
      labels
    });
  }

  public createSummary(options: MetricOptions & { percentiles?: number[] }): Summary<string> {
    const summary = new Summary({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      percentiles: options.percentiles
    });
    this.metrics.set(options.name, summary);
    return summary;
  }

  public observeSummary(name: string, value: number, labels?: MetricLabels): void {
    const metric = this.metrics.get(name) as Summary<string>;
    if (!metric || !(metric instanceof Summary)) {
      throw new Error(`Summary ${name} not found or invalid type`);
    }
    if (labels) {
      metric.observe(labels, value);
    } else {
      metric.observe(value);
    }
    this.collector.addToBatch({
      name,
      type: 'summary',
      value,
      timestamp: Date.now(),
      labels
    });
  }

  public getMetric(name: string): Counter<string> | Gauge<string> | Histogram<string> | Summary<string> | undefined {
    return this.metrics.get(name);
  }

  public removeMetric(name: string): void {
    const metric = this.metrics.get(name);
    if (metric) {
      this.metrics.delete(name);
      // Extra cleanup if needed based on metric type
    }
  }

  public clearMetrics(): void {
    this.metrics.clear();
    this.exporter.clearRegistry();
  }

  public getMetricsContentType(): string {
    return this.exporter.getMetricsContentType();
  }

  public async getMetrics(): Promise<string> {
    return this.exporter.getMetrics();
  }

  public async shutdown(): Promise<void> {
    await this.collector.stop();
    await this.aggregator.stop();
    await this.exporter.shutdown();
  }
}