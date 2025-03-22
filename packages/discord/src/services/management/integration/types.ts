import { BaseService } from '../../base.service';
import { ILoggerService } from '../interfaces/logging/logger.interface';
import { IMetricsService } from '../interfaces/metrics/metrics.interface';
import { IConfigService } from '../interfaces/config/config.interface';

/**
 * Interface voor services die zichzelf kunnen herinitialiseren
 */
export interface IReinitializable {
  reinitialize(): Promise<void>;
}

/**
 * Service types die beschikbaar zijn in het systeem
 */
export enum ManagementServiceType {
  LOGGING = 'logging',
  METRICS = 'metrics',
  CONFIG = 'config',
  MONITORING = 'monitoring'
}

/**
 * Service status informatie
 */
export interface ServiceStatus {
  healthy: boolean;
  status: 'active' | 'inactive' | 'error';
  lastCheck: Date;
  metrics?: {
    responseTime?: number;
    errorRate?: number;
    resourceUsage?: {
      cpu?: number;
      memory?: number;
    };
  };
}

/**
 * Basis interface voor alle management services
 */
export interface IManagementService extends IReinitializable {
  readonly serviceName: string;
  readonly serviceType: ManagementServiceType;
  getStatus(): Promise<ServiceStatus>;
}

/**
 * Registry configuratie opties
 */
export interface RegistryOptions {
  enableHealthChecks?: boolean;
  healthCheckInterval?: number;
  autoRecoveryEnabled?: boolean;
}

/**
 * Core management service types mapping
 */
export interface CoreManagementServices {
  logger: ILoggerService & IManagementService;
  metrics: IMetricsService & IManagementService;
  config: IConfigService & IManagementService;
}

/**
 * Service registratie metadata
 */
export interface ServiceRegistration {
  service: IManagementService;
  dependencies: string[];
  registeredAt: Date;
}