import { BaseError } from '../../../core/errors/base.error';
import { ValidationResult } from './types';

/**
 * Base error class for configuration-related errors
 */
export class ConfigError extends BaseError {
  name = 'ConfigError';
}

/**
 * Thrown when a configuration validation fails
 */
export class ConfigValidationError extends ConfigError {
  override name = 'ConfigValidationError';
  readonly validationResult: ValidationResult;

  constructor(
    message: string,
    validationResult: ValidationResult,
    options?: { cause?: Error }
  ) {
    super(message, {
      ...options,
      metadata: {
        validationResult,
      },
    });
    this.validationResult = validationResult;
  }
}

/**
 * Thrown when a configuration provider encounters an error
 */
export class ConfigProviderError extends ConfigError {
  override name = 'ConfigProviderError';
  readonly provider: string;

  constructor(
    message: string,
    provider: string,
    options?: { cause?: Error }
  ) {
    super(message, {
      ...options,
      metadata: {
        provider,
      },
    });
    this.provider = provider;
  }
}

/**
 * Thrown when a schema operation fails
 */
export class ConfigSchemaError extends ConfigError {
  override name = 'ConfigSchemaError';
  readonly schema?: string;

  constructor(
    message: string,
    schema?: string,
    options?: { cause?: Error }
  ) {
    super(message, {
      ...options,
      metadata: {
        schema,
      },
    });
    this.schema = schema;
  }
}

/**
 * Thrown when attempting to access a secret value in an unsafe way
 */
export class ConfigSecurityError extends ConfigError {
  override name = 'ConfigSecurityError';
  readonly key: string;

  constructor(
    message: string,
    key: string,
    options?: { cause?: Error }
  ) {
    super(message, {
      ...options,
      metadata: {
        key,
      },
    });
    this.key = key;
  }
}

/**
 * Thrown when a configuration key is not found
 */
export class ConfigKeyNotFoundError extends ConfigError {
  override name = 'ConfigKeyNotFoundError';
  readonly key: string;

  constructor(
    message: string,
    key: string,
    options?: { cause?: Error }
  ) {
    super(message, {
      ...options,
      metadata: {
        key,
      },
    });
    this.key = key;
  }
}