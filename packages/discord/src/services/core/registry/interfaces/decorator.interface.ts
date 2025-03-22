import { IBaseService, IServiceDependencies } from "../../interfaces/base/service.interface";
import { Constructor } from "../../../../types";
import { ServiceScope } from "./container.interface";

/**
 * Service decorator opties
 */
export interface ServiceDecoratorOptions {
  /**
   * Service scope (default: SINGLETON)
   */
  scope?: ServiceScope;

  /**
   * Injectie tokens voor deze service
   */
  tokens?: symbol[];

  /**
   * Service naam voor logging en debuggen
   */
  name?: string;
}

/**
 * Metadata voor service decorators
 */
export interface ServiceMetadata<
  TService extends IBaseService = IBaseService,
  TDeps extends IServiceDependencies = IServiceDependencies
> {
  /**
   * Service constructor
   */
  ctor: Constructor<TService>;

  /**
   * Service scope
   */
  scope: ServiceScope;

  /**
   * Injectie tokens
   */
  tokens: symbol[];

  /**
   * Service dependencies
   */
  dependencies?: TDeps;

  /**
   * Service configuratie
   */
  config?: unknown;

  /**
   * Service naam
   */
  name: string;
}

/**
 * Metadata keys voor reflection
 */
export const SERVICE_METADATA_KEY = Symbol('ServiceMetadata');
export const INJECT_METADATA_KEY = Symbol('InjectMetadata');