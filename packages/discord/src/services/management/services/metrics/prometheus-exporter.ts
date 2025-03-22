import { Registry, register, Counter, Gauge, Histogram, Summary } from 'prom-client';
import { IMetricsExporter, ExporterOptions } from '../../interfaces/metrics/exporter.interface';
import { AggregationResult } from '../../interfaces/metrics/aggregator.interface';
import { MetricType } from '../../interfaces/metrics/metrics-service.interface';

type PrometheusMetric = Counter<string> | Gauge<string> | Histogram<string> | Summary<string>;

export class PrometheusExporter implements IMetricsExporter {
  private registry: Registry;
  private prefix: string = '';
  private defaultLabels: Record<string, string> = {};
  private isInitialized: boolean = false;

  // Event handlers
  public onExportError?: (error: Error) => void;
  public onMetricsRequested?: () => Promise<void>;

  constructor(options?: ExporterOptions) {
    this.registry = options?.registry || register;
    if (options?.prefix) this.prefix = options.prefix;
    if (options?.defaultLabels) this.defaultLabels = options.defaultLabels;
  }

  public getRegistry(): Registry {
    return this.registry;
  }

  public clearRegistry(): void {
    this.registry.clear();
  }

  public async registerMetric(result: AggregationResult): Promise<void> {
    try {
      const { name, type, value, labels } = result;
      const metricName = this.getMetricName(name);

      let metric = this.registry.getSingleMetric(metricName) as PrometheusMetric;
      
      if (!metric) {
        metric = await this.createMetric(metricName, type);
        this.registry.registerMetric(metric);
      }

      const finalLabels = { ...this.defaultLabels, ...labels };

      switch (type) {
        case 'counter':
          (metric as Counter<string>).inc({ ...finalLabels, value });
          break;
        case 'gauge':
          (metric as Gauge<string>).set(finalLabels, value);
          break;
        case 'histogram':
          (metric as Histogram<string>).observe(finalLabels, value);
          break;
        case 'summary':
          (metric as Summary<string>).observe(finalLabels, value);
          break;
        default:
          throw new Error(`Unsupported metric type: ${type}`);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public async registerMetrics(results: AggregationResult[]): Promise<void> {
    await Promise.all(results.map(result => this.registerMetric(result)));
  }

  public getMetricsContentType(): string {
    return this.registry.contentType;
  }

  public async getMetrics(): Promise<string> {
    try {
      if (this.onMetricsRequested) {
        await this.onMetricsRequested();
      }
      return await this.registry.metrics();
    } catch (error) {
      this.handleError(error as Error);
      return '';
    }
  }

  public setOptions(options: ExporterOptions): void {
    if (options.prefix !== undefined) {
      this.prefix = options.prefix;
    }
    if (options.defaultLabels) {
      this.defaultLabels = { ...this.defaultLabels, ...options.defaultLabels };
    }
    if (options.registry) {
      this.registry = options.registry;
    }
  }

  public async initialize(): Promise<void> {
    if (!this.isInitialized) {
      // Set default registry settings
      this.registry.setDefaultLabels(this.defaultLabels);
      this.isInitialized = true;
    }
  }

  public async shutdown(): Promise<void> {
    await this.registry.clear();
  }

  public isHealthy(): boolean {
    return this.isInitialized;
  }

  private getMetricName(name: string): string {
    return this.prefix ? `${this.prefix}_${name}` : name;
  }

  private async createMetric(name: string, type: MetricType): Promise<PrometheusMetric> {
    const config = {
      name,
      help: `Metric ${name}`,
      labelNames: Object.keys(this.defaultLabels),
      registers: [this.registry]
    };

    switch (type) {
      case 'counter':
        return new Counter(config);
      case 'gauge':
        return new Gauge(config);
      case 'histogram':
        return new Histogram({
          ...config,
          buckets: [0.1, 0.5, 1, 2, 5]
        });
      case 'summary':
        return new Summary({
          ...config,
          percentiles: [0.5, 0.75, 0.95, 0.99]
        });
      default:
        throw new Error(`Unsupported metric type: ${type}`);
    }
  }

  private handleError(error: Error): void {
    if (this.onExportError) {
      this.onExportError(error);
    } else {
      console.error('Prometheus exporter error:', error);
    }
  }
}