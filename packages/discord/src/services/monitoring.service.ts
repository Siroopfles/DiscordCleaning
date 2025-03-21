import { BaseService } from './base.service';
import {
  DiscordClient,
  MonitoringOptions,
  MonitoringEvent,
  PerformanceMetrics,
  LogLevel
} from '../types';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

export class MonitoringService extends BaseService {
  private readonly metricsService?: MetricsService;
  private readonly loggerService: LoggerService;
  private performanceMetrics: PerformanceMetrics;
  private eventBuffer: MonitoringEvent[];
  private readonly bufferSize: number;
  private flushInterval: NodeJS.Timeout;

  constructor(
    client: DiscordClient,
    options: MonitoringOptions = {}
  ) {
    super(client);

    // Initialize services
    this.loggerService = new LoggerService(client, {
      level: options.logLevel || 'info',
      format: 'json',
      timestamp: true,
      transports: {
        console: true,
        file: {
          filename: 'discord-bot.log'
        }
      }
    });

    if (options.metricsEnabled) {
      this.metricsService = new MetricsService(
        client,
        options.metricsPrefix
      );
    }

    // Initialize performance metrics
    this.performanceMetrics = {
      commandLatencies: new Map(),
      eventLatencies: new Map(),
      memoryUsage: process.memoryUsage()
    };

    // Event buffer setup
    this.eventBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = setInterval(() => this.flushEvents(), 5000);
  }

  protected async initialize(): Promise<void> {
    await Promise.all([
      this.loggerService.initialize(),
      this.metricsService?.initialize()
    ]);

    this.log('info', 'Monitoring service initialized', {
      metricsEnabled: !!this.metricsService
    });
  }

  // Event tracking
  public trackEvent(category: string, action: string, metadata?: Record<string, any>): void {
    const event: MonitoringEvent = {
      category,
      action,
      timestamp: Date.now(),
      metadata
    };

    this.eventBuffer.push(event);
    if (this.eventBuffer.length >= this.bufferSize) {
      this.flushEvents();
    }
  }

  // Performance monitoring
  public trackCommandExecution(command: string, duration: number): void {
    if (!this.performanceMetrics.commandLatencies.has(command)) {
      this.performanceMetrics.commandLatencies.set(command, []);
    }
    this.performanceMetrics.commandLatencies.get(command)!.push(duration);

    this.metricsService?.recordCommandLatency(command, duration);
    this.log('debug', 'Command execution tracked', { command, duration });
  }

  public trackEventProcessing(event: string, duration: number): void {
    if (!this.performanceMetrics.eventLatencies.has(event)) {
      this.performanceMetrics.eventLatencies.set(event, []);
    }
    this.performanceMetrics.eventLatencies.get(event)!.push(duration);

    this.metricsService?.recordEventLatency(event, duration);
    this.log('debug', 'Event processing tracked', { event, duration });
  }

  // Currency operations
  public trackCurrencyOperation(type: string, success: boolean): void {
    this.metricsService?.trackCurrencyOperation(type, success);
    this.log('debug', 'Currency operation tracked', { type, success });
  }

  // Rate limiting
  public trackRateLimitAttempt(blocked: boolean): void {
    this.metricsService?.trackRateLimitAttempt(blocked);
    this.log('debug', 'Rate limit attempt tracked', { blocked });
  }

  // User activity
  public updateActiveUsers(guildId: string, count: number): void {
    this.metricsService?.updateActiveUsers(guildId, count);
    this.log('debug', 'Active users updated', { guildId, count });
  }

  // Metrics exposure
  public async getMetrics(): Promise<string | undefined> {
    return this.metricsService?.getMetricsAsString();
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    this.performanceMetrics.memoryUsage = process.memoryUsage();
    return { ...this.performanceMetrics };
  }

  // Logger configuration
  public setLogLevel(level: LogLevel): void {
    this.loggerService.setLogLevel(level);
  }

  public getLogLevel(): LogLevel {
    return this.loggerService.getLogLevel();
  }

  // Cleanup
  public shutdown(): void {
    clearInterval(this.flushInterval);
    this.flushEvents();
  }

  private flushEvents(): void {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    this.log('debug', 'Flushing events', { count: events.length });
    events.forEach(event => {
      this.log('info', `Event: ${event.category}/${event.action}`, event);
    });
  }
}