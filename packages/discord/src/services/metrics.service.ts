import { BaseService } from './base.service';
import { DiscordClient, MetricsExporter, MetricsRegistry } from '../types';
import { Registry, Counter, Gauge } from 'prom-client';

export class MetricsService extends BaseService implements MetricsExporter {
  public readonly registry: Registry;
  private readonly metrics: MetricsRegistry['metrics'];
  private readonly prefix: string;

  constructor(client: DiscordClient, prefix = 'discord_bot') {
    super(client);
    this.prefix = prefix;
    this.registry = new Registry();
    this.metrics = this.initializeMetrics();
    
    // Voeg de metrics toe aan de registry
    Object.values(this.metrics).forEach(metric => this.registry.registerMetric(metric));
  }

  public async initialize(): Promise<void> {
    this.log('info', 'Metrics service initialized');
    
    // Default process metrics registreren
    this.registry.setDefaultLabels({
      app: 'discord_bot',
      env: process.env.NODE_ENV || 'development'
    });
    return Promise.resolve();
  }

  private initializeMetrics(): MetricsRegistry['metrics'] {
    return {
      currencyOperations: new Counter({
        name: `${this.prefix}_currency_operations_total`,
        help: 'Total number of currency operations',
        labelNames: ['type', 'status']
      }),

      rateLimitAttempts: new Counter({
        name: `${this.prefix}_rate_limit_attempts_total`,
        help: 'Total number of rate limit checks',
        labelNames: ['status']
      }),

      activeUsers: new Gauge({
        name: `${this.prefix}_active_users`,
        help: 'Number of active users',
        labelNames: ['guild_id']
      }),

      commandLatency: new Gauge({
        name: `${this.prefix}_command_latency_seconds`,
        help: 'Command execution latency in seconds',
        labelNames: ['command']
      }),

      eventLatency: new Gauge({
        name: `${this.prefix}_event_latency_seconds`,
        help: 'Event processing latency in seconds',
        labelNames: ['event']
      })
    };
  }

  public async getMetricsAsString(): Promise<string> {
    return this.registry.metrics();
  }

  // Currency metrics
  public trackCurrencyOperation(type: string, success: boolean): void {
    this.metrics.currencyOperations.inc({
      type,
      status: success ? 'success' : 'failure'
    });
  }

  // Rate limiting metrics
  public trackRateLimitAttempt(blocked: boolean): void {
    this.metrics.rateLimitAttempts.inc({
      status: blocked ? 'blocked' : 'allowed'
    });
  }

  // User activity metrics
  public updateActiveUsers(guildId: string, count: number): void {
    this.metrics.activeUsers.set({ guild_id: guildId }, count);
  }

  // Performance metrics
  public recordCommandLatency(command: string, duration: number): void {
    this.metrics.commandLatency.set({ command }, duration);
  }

  public recordEventLatency(event: string, duration: number): void {
    this.metrics.eventLatency.set({ event }, duration);
  }

  // Expose metrics for specific subsystems
  public getMetrics(): MetricsRegistry['metrics'] {
    return this.metrics;
  }
}