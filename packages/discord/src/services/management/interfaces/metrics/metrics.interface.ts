import { MetricDefinition, MetricType } from './types';

/**
 * Basis metrics service interface
 */
export interface IMetricsService {
  /**
   * Registreert een nieuwe metriek definitie
   */
  registerMetric(definition: MetricDefinition): void;

  /**
   * Registreert een metriek
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Verhoogt een counter metriek
   */
  incrementCounter(name: string, labels?: Record<string, string>): void;

  /**
   * Registreert een duur metriek
   */
  recordDuration(name: string, durationMs: number, labels?: Record<string, string>): void;

  /**
   * Zet een gauge metriek waarde
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Exporteert alle metrieken voor monitoring
   */
  export(): Promise<string>;
}