import { BaseError } from '../../core/errors/base.error';
import { ErrorMetadata } from '../../core/errors/types';

export class ManagementServiceError extends BaseError {
  constructor(message: string, options?: { cause?: Error; metadata?: ErrorMetadata }) {
    super(message, options);
    Object.defineProperty(this, 'name', {
      value: 'ManagementServiceError',
      configurable: true,
      writable: true
    });
  }
}

export class ServiceRegistrationError extends ManagementServiceError {
  constructor(serviceName: string, reason: string, cause?: Error) {
    super(`Failed to register service '${serviceName}': ${reason}`, {
      cause,
      metadata: { serviceName, reason }
    });
    Object.defineProperty(this, 'name', {
      value: 'ServiceRegistrationError',
      configurable: true,
      writable: true
    });
  }
}

export class ServiceNotFoundError extends ManagementServiceError {
  constructor(serviceName: string) {
    super(`Service '${serviceName}' not found in registry`, {
      metadata: { serviceName }
    });
    Object.defineProperty(this, 'name', {
      value: 'ServiceNotFoundError',
      configurable: true,
      writable: true
    });
  }
}

export class ServiceDependencyError extends ManagementServiceError {
  constructor(serviceName: string, missingDependencies: string[]) {
    super(`Service '${serviceName}' has unmet dependencies: ${missingDependencies.join(', ')}`, {
      metadata: { serviceName, missingDependencies }
    });
    Object.defineProperty(this, 'name', {
      value: 'ServiceDependencyError',
      configurable: true,
      writable: true
    });
  }
}

export class ServiceHealthError extends ManagementServiceError {
  constructor(serviceName: string, status: string, details?: Record<string, unknown>) {
    super(`Service '${serviceName}' health check failed: ${status}`, {
      metadata: { serviceName, status, details }
    });
    Object.defineProperty(this, 'name', {
      value: 'ServiceHealthError',
      configurable: true,
      writable: true
    });
  }
}