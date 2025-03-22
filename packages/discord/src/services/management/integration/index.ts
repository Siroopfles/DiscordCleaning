import { RegistryOptions } from './types';

// Core exports
export * from './types';
export * from './errors';
export * from './service-registry';
export * from './abstract-management.service';

// Constants
export const MANAGEMENT_SERVICE_VERSION = '1.0.0';

// Default registry options
export const DEFAULT_REGISTRY_OPTIONS: Required<RegistryOptions> = {
  enableHealthChecks: true,
  healthCheckInterval: 30000, // 30 seconds
  autoRecoveryEnabled: true
};