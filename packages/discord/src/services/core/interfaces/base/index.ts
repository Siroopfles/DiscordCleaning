/**
 * Core Service Interfaces
 * @module core/interfaces/base
 */

export * from './lifecycle.interface';
export * from './service.interface';
export * from './factory.interface';

// Re-export veelgebruikte types voor convenience
export type {
  IServiceDependencies,
  IBaseService
} from './service.interface';

export type {
  IServiceConstructor,
  IServiceFactory
} from './factory.interface';

export type {
  IServiceLifecycle
} from './lifecycle.interface';