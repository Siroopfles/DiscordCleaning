import { DiscordClient } from '../../../types';
import { BaseService } from '../../base.service';
import { CoreManagementServices, IManagementService, RegistryOptions, ServiceRegistration, ManagementServiceType } from './types';
import { ServiceDependencyError, ServiceNotFoundError, ServiceRegistrationError } from './errors';
import { ILoggerService } from '../interfaces/logging/logger.interface';
import { IMetricsService } from '../interfaces/metrics/metrics.interface';
import { IConfigService } from '../interfaces/config/config.interface';

/**
 * Registry voor management services met dependency injection en health monitoring
 */
export class ManagementServiceRegistry extends BaseService {
  private readonly services: Map<string, ServiceRegistration> = new Map();
  private readonly options: Required<RegistryOptions>;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(client: DiscordClient, options: RegistryOptions = {}) {
    super(client);
    this.options = {
      enableHealthChecks: options.enableHealthChecks ?? true,
      healthCheckInterval: options.healthCheckInterval ?? 30000,
      autoRecoveryEnabled: options.autoRecoveryEnabled ?? true
    };
  }

  /**
   * Initialisatie van de registry
   */
  protected async initialize(): Promise<void> {
    if (this.options.enableHealthChecks) {
      this.startHealthChecks();
    }
  }

  /**
   * Registreert een nieuwe service met zijn dependencies
   */
  async register<T extends IManagementService>(
    service: T,
    dependencies: string[] = []
  ): Promise<void> {
    try {
      // Controleer of service al geregistreerd is
      if (this.services.has(service.serviceName)) {
        throw new ServiceRegistrationError(
          service.serviceName,
          'Service is already registered'
        );
      }

      // Valideer dependencies
      await this.validateDependencies(service.serviceName, dependencies);

      // Registreer de service
      this.services.set(service.serviceName, {
        service,
        dependencies,
        registeredAt: new Date()
      });

    } catch (error) {
      throw new ServiceRegistrationError(
        service.serviceName,
        'Registration failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Haalt een geregistreerde service op met type casting
   */
  getService<T extends IManagementService>(serviceName: string): T {
    const registration = this.services.get(serviceName);
    if (!registration) {
      throw new ServiceNotFoundError(serviceName);
    }
    return registration.service as T;
  }

  /**
   * Haalt de core management services op met specifieke type checking
   */
  getCoreServices(): Partial<CoreManagementServices> {
    const services: Partial<CoreManagementServices> = {};

    try {
      const loggerService = this.getService<IManagementService & ILoggerService>('logging');
      if (loggerService.serviceType === ManagementServiceType.LOGGING) {
        services.logger = loggerService;
      }
    } catch (error) {
      this.log('warn', 'Logger service not available');
    }

    try {
      const metricsService = this.getService<IManagementService & IMetricsService>('metrics');
      if (metricsService.serviceType === ManagementServiceType.METRICS) {
        services.metrics = metricsService;
      }
    } catch (error) {
      this.log('warn', 'Metrics service not available');
    }

    try {
      const configService = this.getService<IManagementService & IConfigService>('config');
      if (configService.serviceType === ManagementServiceType.CONFIG) {
        services.config = configService;
      }
    } catch (error) {
      this.log('warn', 'Config service not available');
    }

    return services;
  }

  /**
   * Valideert service dependencies
   */
  private async validateDependencies(
    serviceName: string,
    dependencies: string[]
  ): Promise<void> {
    const missingDependencies = dependencies.filter(
      dep => !this.services.has(dep)
    );

    if (missingDependencies.length > 0) {
      throw new ServiceDependencyError(serviceName, missingDependencies);
    }

    // Controleer op circulaire dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const checkCircular = (current: string) => {
      if (visiting.has(current)) {
        throw new ServiceDependencyError(serviceName, ['Circular dependency detected']);
      }

      if (visited.has(current)) return;

      visiting.add(current);
      const registration = this.services.get(current);
      if (registration) {
        for (const dep of registration.dependencies) {
          checkCircular(dep);
        }
      }
      visiting.delete(current);
      visited.add(current);
    };

    dependencies.forEach(dep => checkCircular(dep));
  }

  /**
   * Start periodieke health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, registration] of this.services) {
        try {
          const status = await registration.service.getStatus();
          
          if (!status.healthy && this.options.autoRecoveryEnabled) {
            this.log('warn', `Service '${name}' is unhealthy, attempting recovery`, status);
            await registration.service.reinitialize();
          }
        } catch (error) {
          this.log('error', `Health check failed for service '${name}'`, error);
        }
      }
    }, this.options.healthCheckInterval);
  }

  /**
   * Cleanup registry resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    this.services.clear();
  }
}