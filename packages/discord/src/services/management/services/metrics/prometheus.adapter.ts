import { Registry } from 'prom-client';
import { AbstractMetricsService } from './abstract-metrics.service';
import { IMetricsCollector } from '../../interfaces/metrics/collector.interface';
import { IMetricsAggregator } from '../../interfaces/metrics/aggregator.interface';
import { IMetricsExporter } from '../../interfaces/metrics/exporter.interface';
import { DiscordClient } from '../../../../types';

export class PrometheusAdapter extends AbstractMetricsService {
  private readonly registry: Registry;

  constructor(
    client: DiscordClient,
    collector: IMetricsCollector,
    aggregator: IMetricsAggregator,
    exporter: IMetricsExporter
  ) {
    super(client, collector, aggregator, exporter);
    this.registry = exporter.getRegistry();
    
    // Register default metrics
    this.setupDefaultMetrics();
  }

  private setupDefaultMetrics(): void {
    // Discord bot specific metrics
    this.createGauge({
      name: 'discord_bot_guilds_total',
      help: 'Total number of guilds the bot is in'
    });

    this.createGauge({
      name: 'discord_bot_users_total',
      help: 'Total number of users across all guilds'
    });

    this.createGauge({
      name: 'discord_bot_commands_total',
      help: 'Total number of registered commands'
    });

    this.createCounter({
      name: 'discord_bot_commands_executed_total',
      help: 'Total number of commands executed',
      labelNames: ['command', 'guild', 'status']
    });

    this.createHistogram({
      name: 'discord_bot_command_duration_seconds',
      help: 'Command execution duration in seconds',
      labelNames: ['command'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    // Performance metrics
    this.createGauge({
      name: 'discord_bot_memory_usage_bytes',
      help: 'Memory usage in bytes'
    });

    this.createGauge({
      name: 'discord_bot_cpu_usage_percent',
      help: 'CPU usage percentage'
    });

    // Rate limiting metrics
    this.createCounter({
      name: 'discord_bot_rate_limits_hit_total',
      help: 'Total number of rate limits hit',
      labelNames: ['endpoint']
    });

    this.createGauge({
      name: 'discord_bot_rate_limit_remaining',
      help: 'Remaining requests before rate limit',
      labelNames: ['endpoint']
    });
  }

  protected async initialize(): Promise<void> {
    await super.initialize();

    // Set up periodic metric collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 15000); // Every 15 seconds

    // Set up event listeners for Discord client
    this.client.on('ready', () => {
      this.updateBotMetrics();
    });

    this.client.on('guildCreate', () => {
      this.updateBotMetrics();
    });

    this.client.on('guildDelete', () => {
      this.updateBotMetrics();
    });

    this.client.on('interactionCreate', (interaction) => {
      if (!interaction.isCommand()) return;

      const startTime = process.hrtime();

      // After command completion
      Promise.resolve().then(() => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds + nanoseconds / 1e9;

        this.observeHistogram('discord_bot_command_duration_seconds', duration, {
          command: interaction.commandName
        });

        this.incrementCounter('discord_bot_commands_executed_total', {
          command: interaction.commandName,
          guild: interaction.guildId || 'dm',
          status: 'success'
        });
      });
    });
  }

  private async collectSystemMetrics(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    this.setGauge('discord_bot_memory_usage_bytes', memoryUsage.heapUsed);

    // Simple CPU usage calculation
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    const cpuPercent = (endUsage.user + endUsage.system) / 1000000; // Convert to percentage

    this.setGauge('discord_bot_cpu_usage_percent', cpuPercent);
  }

  private updateBotMetrics(): void {
    if (!this.client.isReady()) return;

    this.setGauge('discord_bot_guilds_total', this.client.guilds.cache.size);
    this.setGauge('discord_bot_users_total', this.client.users.cache.size);
    
    if (this.client.application) {
      this.setGauge('discord_bot_commands_total', 
        this.client.application.commands.cache.size);
    }
  }
}