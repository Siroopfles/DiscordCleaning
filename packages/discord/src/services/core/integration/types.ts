/**
 * Beschikbare metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * Resource monitoring metrics
 */
export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number; // In MB
  uptimeSeconds: number;
}

/**
 * Component health status
 */
export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastUpdate: number;
  [key: string]: any;
}

/**
 * System health status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  details: {
    [component: string]: ComponentHealth;
  };
}

/**
 * Service error context
 */
export interface ErrorContext {
  timestamp: number;
  service: string;
  error: Error | unknown;
}