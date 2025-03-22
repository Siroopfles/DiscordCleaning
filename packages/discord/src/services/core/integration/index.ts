import { ServiceError } from '../errors/service.error';
import { IServiceDependencies } from '../interfaces/base/service.interface';
import { MonitoringService, IMonitoringConfig, IMonitoringDependencies } from './monitoring';
import { EventBusService, IEventBusConfig, IEventBusDependencies } from './events';
import { HealthService, IHealthConfig, IHealthDependencies, HealthCheck } from './health';

export interface IntegrationServicesConfig {
  monitoring?: IMonitoringConfig;
  eventBus?: IEventBusConfig;
  health?: IHealthConfig;
}

export interface IntegrationServicesDependencies extends IServiceDependencies {
  monitoring?: Partial<IMonitoringDependencies>;
  eventBus?: Partial<IEventBusDependencies>;
  health?: Partial<IHealthDependencies>;
}

export class IntegrationServices {
  private static instance: IntegrationServices;
  
  private _monitoring?: MonitoringService;
  private _eventBus?: EventBusService;
  private _health?: HealthService;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): IntegrationServices {
    if (!IntegrationServices.instance) {
      IntegrationServices.instance = new IntegrationServices();
    }
    return IntegrationServices.instance;
  }

  /**
   * Initialize integration services
   */
  public async initialize(
    dependencies: IntegrationServicesDependencies,
    config: IntegrationServicesConfig = {}
  ): Promise<void> {
    try {
      // Initialize monitoring first as andere services er gebruik van kunnen maken
      if (!this._monitoring) {
        this._monitoring = new MonitoringService(
          { ...dependencies, ...dependencies.monitoring },
          config.monitoring
        );
        await this._monitoring.initialize();
      }

      // Initialize event bus
      if (!this._eventBus) {
        this._eventBus = new EventBusService(
          { ...dependencies, ...dependencies.eventBus },
          config.eventBus
        );
        await this._eventBus.initialize();
      }

      // Initialize health service en configureer defaults
      if (!this._health) {
        const healthDeps = {
          ...dependencies,
          ...dependencies.health,
          // Voeg default health checks toe
          checks: [
            this.createMonitoringCheck(),
            this.createEventBusCheck(),
            ...(dependencies.health?.checks || [])
          ]
        };

        this._health = new HealthService(healthDeps, config.health);
        await this._health.initialize();
      }

    } catch (error) {
      throw new ServiceError(
        'Failed to initialize integration services',
        {
          service: 'core:integration',
          operation: 'initialize',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        }
      );
    }
  }

  /**
   * Get monitoring service instance
   */
  public get monitoring(): MonitoringService {
    if (!this._monitoring) {
      throw new ServiceError(
        'Monitoring service not initialized',
        {
          service: 'core:integration',
          operation: 'getMonitoring'
        }
      );
    }
    return this._monitoring;
  }

  /**
   * Get event bus service instance
   */
  public get eventBus(): EventBusService {
    if (!this._eventBus) {
      throw new ServiceError(
        'Event bus service not initialized',
        {
          service: 'core:integration',
          operation: 'getEventBus'
        }
      );
    }
    return this._eventBus;
  }

  /**
   * Get health service instance
   */
  public get health(): HealthService {
    if (!this._health) {
      throw new ServiceError(
        'Health service not initialized',
        {
          service: 'core:integration',
          operation: 'getHealth'
        }
      );
    }
    return this._health;
  }

  /**
   * Destroy all services
   */
  public async destroy(): Promise<void> {
    await Promise.all([
      this._monitoring?.destroy(),
      this._eventBus?.destroy(),
      this._health?.destroy()
    ]);

    this._monitoring = undefined;
    this._eventBus = undefined;
    this._health = undefined;
  }

  /**
   * Create default monitoring service health check
   */
  private createMonitoringCheck(): HealthCheck {
    return {
      name: 'monitoring',
      check: async () => {
        if (!this._monitoring) {
          return {
            status: 'unhealthy',
            lastUpdate: Date.now(),
            error: 'Monitoring service not initialized'
          };
        }

        const metrics = this._monitoring.getResourceMetrics();
        const isHealthy = metrics.cpuUsage < 90 && metrics.memoryUsage < 1024; // 90% CPU, 1GB RAM

        return {
          status: isHealthy ? 'healthy' : 'degraded',
          lastUpdate: Date.now(),
          metrics
        };
      },
      interval: 60000 // 1 minuut
    };
  }

  /**
   * Create default event bus service health check
   */
  private createEventBusCheck(): HealthCheck {
    return {
      name: 'eventBus',
      check: async () => {
        if (!this._eventBus) {
          return {
            status: 'unhealthy',
            lastUpdate: Date.now(),
            error: 'Event bus service not initialized'
          };
        }

        // Emit test event om connectiviteit te checken
        try {
          await this._eventBus.emit('health:check', { timestamp: Date.now() });
          return {
            status: 'healthy',
            lastUpdate: Date.now()
          };
        } catch (error) {
          return {
            status: 'degraded',
            lastUpdate: Date.now(),
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },
      interval: 30000 // 30 seconden
    };
  }
}

// Export alles voor gebruik in andere modules
export * from './monitoring';
export * from './events';
export * from './health';
export * from './types';

// Export singleton instance
export const integrationServices = IntegrationServices.getInstance();