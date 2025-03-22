import { IMetricsCollector, MetricBatch, BatchOptions } from '../../interfaces/metrics/collector.interface';
import { BaseService } from '../../../base.service';
import { DiscordClient } from '../../../../types';

export class MetricsCollector extends BaseService implements IMetricsCollector {
  private batch: MetricBatch[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private options: Required<BatchOptions> = {
    maxSize: 1000,
    flushIntervalMs: 10000 // 10 seconds
  };

  // Event handlers
  public onBatchFull?: (batch: MetricBatch[]) => Promise<void>;
  public onBatchFlush?: (batch: MetricBatch[]) => Promise<void>;
  public onError?: (error: Error) => void;

  constructor(
    client: DiscordClient,
    options?: BatchOptions
  ) {
    super(client);
    if (options) {
      this.setBatchOptions(options);
    }
  }

  protected async initialize(): Promise<void> {
    await this.start();
  }

  public addToBatch(metric: MetricBatch): void {
    try {
      this.batch.push(metric);

      if (this.batch.length >= this.options.maxSize) {
        this.handleBatchFull();
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public async flush(): Promise<void> {
    try {
      if (this.batch.length > 0) {
        const batchToFlush = [...this.batch];
        this.batch = [];

        await this.handleBatchFlush(batchToFlush);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public setBatchOptions(options: BatchOptions): void {
    this.options = {
      maxSize: options.maxSize ?? this.options.maxSize,
      flushIntervalMs: options.flushIntervalMs ?? this.options.flushIntervalMs
    };

    // Reset flush interval if running
    if (this.flushInterval) {
      this.resetFlushInterval();
    }
  }

  public async start(): Promise<void> {
    this.setupFlushInterval();
  }

  public async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    await this.flush();
  }

  private async handleBatchFull(): Promise<void> {
    const batchToProcess = [...this.batch];
    this.batch = [];

    if (this.onBatchFull) {
      try {
        await this.onBatchFull(batchToProcess);
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  }

  private async handleBatchFlush(batchToFlush: MetricBatch[]): Promise<void> {
    if (this.onBatchFlush) {
      try {
        await this.onBatchFlush(batchToFlush);
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  }

  private handleError(error: Error): void {
    this.log('error', 'Metrics collector error:', error);
    
    if (this.onError) {
      this.onError(error);
    }
  }

  private setupFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(
      () => this.flush(),
      this.options.flushIntervalMs
    );

    // Prevent interval from keeping the process alive
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }

  private resetFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.setupFlushInterval();
    }
  }
}