import { IBaseService, IServiceDependencies } from '../interfaces/base/service.interface';
import { ServiceError } from '../errors/service.error';
import { MetricType, HealthStatus, ResourceMetrics, ComponentHealth } from './types';

export interface IMonitoringConfig {
  metricsInterval: number; // milliseconds
  enableResourceMonitoring: boolean;
  healthCheckInterval: number; // milliseconds
  metricsBufferSize: number;
}

export interface IMonitoringDependencies extends IServiceDependencies {
  metricsExporter?: {
    exportMetric(name: string, value: number, labels?: Record<string, string>): void;
  };
}

export class MonitoringService implements IBaseService<IMonitoringDependencies, IMonitoringConfig> {
  public readonly serviceId = 'core:monitoring';
  
  // Private fields voor immutability
  private readonly _dependencies: IMonitoringDependencies;
  private readonly _config: IMonitoringConfig;
  private metricsBuffer: Map<string, { value: number; timestamp: number }>;
  private resourceMetrics: ResourceMetrics;
  private healthStatus: HealthStatus;
  private intervals: NodeJS.Timeout[];

  constructor(
    dependencies: IMonitoringDependencies,
    config: IMonitoringConfig = {
      metricsInterval: 10000,
      enableResourceMonitoring: true,
      healthCheckInterval: 30000,
      metricsBufferSize: 1000,
    }
  ) {
    this._dependencies = dependencies;
    this._config = config;
    this.metricsBuffer = new Map();
    this.resourceMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      uptimeSeconds: 0
    };
    this.healthStatus = {
      status: 'healthy',
      lastCheck: Date.now(),
      details: {}
    };
    this.intervals = [];
  }

  // Getters voor readonly properties
  get dependencies(): IMonitoringDependencies {
    return this._dependencies;
  }

  get config(): IMonitoringConfig {
    return this._config;
  }

  public async initialize(): Promise<void> {
    try {
      this.startMetricsCollection();
      if (this.config.enableResourceMonitoring) {
        this.startResourceMonitoring();
      }
      this.startHealthChecks();
      this.log('info', 'MonitoringService initialized successfully');
    } catch (error) {
      throw new ServiceError(
        'Failed to initialize monitoring service',
        { 
          service: this.serviceId,
          operation: 'initialize',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        }
      );
    }
  }

  /**
   * Record een metric met opgegeven type en waarde
   */
  public recordMetric(
    name: string, 
    value: number, 
    type: MetricType = 'gauge',
    labels: Record<string, string> = {}
  ): void {
    if (this.metricsBuffer.size >= this.config.metricsBufferSize) {
      this.flushOldestMetrics(Math.floor(this.config.metricsBufferSize * 0.2));
    }

    const metricKey = this.formatMetricKey(name, type, labels);
    this.metricsBuffer.set(metricKey, {
      value,
      timestamp: Date.now()
    });

    // Direct exporteren als er een exporter beschikbaar is
    if (this.dependencies.metricsExporter) {
      this.dependencies.metricsExporter.exportMetric(name, value, labels);
    }
  }

  /**
   * Update de health status van een specifieke component
   */
  public updateHealthStatus(
    component: string,
    status: ComponentHealth['status'],
    details: Record<string, unknown> = {}
  ): void {
    const componentHealth: ComponentHealth = {
      status,
      lastUpdate: Date.now(),
      ...details
    };

    this.healthStatus = {
      ...this.healthStatus,
      details: {
        ...this.healthStatus.details,
        [component]: componentHealth
      },
      status: this.calculateOverallHealth(),
      lastCheck: Date.now()
    };

    this.log('info', `Health status updated for ${component}: ${status}`);
  }

  /**
   * Krijg de huidige health status
   */
  public getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Krijg de huidige resource metrics
   */
  public getResourceMetrics(): ResourceMetrics {
    return { ...this.resourceMetrics };
  }

  public async updateConfig(config: Partial<IMonitoringConfig>): Promise<void> {
    // Maak een nieuwe MonitoringService instantie met de nieuwe config
    const newService = new MonitoringService(this.dependencies, {
      ...this.config,
      ...config
    });
    
    // Stop huidige monitoring en start opnieuw
    await this.destroy();
    await newService.initialize();
    
    // Kopieer relevante state
    this.metricsBuffer = newService.metricsBuffer;
    this.resourceMetrics = newService.resourceMetrics;
    this.healthStatus = newService.healthStatus;
    this.intervals = newService.intervals;
  }

  public async updateDependencies(deps: Partial<IMonitoringDependencies>): Promise<void> {
    // Maak een nieuwe MonitoringService instantie met de nieuwe dependencies
    const newService = new MonitoringService({
      ...this.dependencies,
      ...deps
    }, this.config);
    
    // Stop huidige monitoring en start opnieuw
    await this.destroy();
    await newService.initialize();
    
    // Kopieer relevante state
    this.metricsBuffer = newService.metricsBuffer;
    this.resourceMetrics = newService.resourceMetrics;
    this.healthStatus = newService.healthStatus;
    this.intervals = newService.intervals;
  }

  public async destroy(): Promise<void> {
    this.stopIntervals();
    this.metricsBuffer.clear();
    this.log('info', 'MonitoringService destroyed successfully');
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void {
    if (this.dependencies.logger) {
      this.dependencies.logger[level](message, ...args);
    }
  }

  private startMetricsCollection(): void {
    const interval = setInterval(() => {
      this.flushMetrics();
    }, this.config.metricsInterval);
    this.intervals.push(interval);
  }

  private startResourceMonitoring(): void {
    const interval = setInterval(() => {
      const usage = process.memoryUsage();
      this.resourceMetrics = {
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
        memoryUsage: usage.heapUsed / 1024 / 1024, // Convert to MB
        uptimeSeconds: process.uptime()
      };
      
      // Record resource metrics
      this.recordMetric('process_cpu_usage', this.resourceMetrics.cpuUsage, 'gauge');
      this.recordMetric('process_memory_usage_mb', this.resourceMetrics.memoryUsage, 'gauge');
      this.recordMetric('process_uptime_seconds', this.resourceMetrics.uptimeSeconds, 'gauge');
    }, this.config.metricsInterval);
    this.intervals.push(interval);
  }

  private startHealthChecks(): void {
    const interval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    this.intervals.push(interval);
  }

  private performHealthCheck(): void {
    // Basis health checks
    this.updateHealthStatus('system', 'healthy', {
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });

    // Discord client check
    if (this.dependencies.client) {
      this.updateHealthStatus('discord', this.dependencies.client.isReady() ? 'healthy' : 'degraded', {
        ping: this.dependencies.client.ws.ping
      });
    }
  }

  private calculateOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(this.healthStatus.details)
      .map((d: ComponentHealth) => d.status);
    
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private formatMetricKey(name: string, type: MetricType, labels: Record<string, string>): string {
    const labelString = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}:${type}${labelString ? `{${labelString}}` : ''}`;
  }

  private flushMetrics(): void {
    if (!this.dependencies.metricsExporter) return;

    for (const [key, metric] of this.metricsBuffer.entries()) {
      const [name, type, labelsStr] = key.split(/[:{]/);
      const labels = labelsStr ? 
        Object.fromEntries(
          labelsStr.slice(0, -1).split(',')
            .map(l => l.split('=').map(s => s.replace(/"/g, '')))
        ) : {};

      this.dependencies.metricsExporter.exportMetric(name, metric.value, labels);
    }

    this.metricsBuffer.clear();
  }

  private flushOldestMetrics(count: number): void {
    const entries = Array.from(this.metricsBuffer.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.metricsBuffer.delete(entries[i][0]);
    }
  }

  private stopIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }
}