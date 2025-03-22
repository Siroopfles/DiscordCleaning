/**
 * Core types for the Config Management System
 */

/**
 * Represents a JSON Schema definition
 */
export interface ConfigSchema {
  $schema?: string;
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Configuration source types
 */
export enum ConfigSourceType {
  FILE = 'file',
  ENVIRONMENT = 'environment',
  REMOTE = 'remote',
  MEMORY = 'memory'
}

/**
 * Configuration value with metadata
 */
export interface ConfigValue<T = unknown> {
  value: T;
  source: ConfigSourceType;
  timestamp: number;
  isSecret?: boolean;
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent<T = unknown> {
  key: string;
  oldValue?: ConfigValue<T>;
  newValue: ConfigValue<T>;
  timestamp: number;
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Configuration provider options
 */
export interface ConfigProviderOptions {
  readonly name: string;
  readonly type: ConfigSourceType;
  readonly priority?: number;
  readonly refreshInterval?: number;
  readonly schema?: ConfigSchema;
}