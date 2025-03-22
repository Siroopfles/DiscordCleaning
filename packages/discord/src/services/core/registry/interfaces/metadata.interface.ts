import { IBaseService, IServiceDependencies } from "../../interfaces/base/service.interface";
import { Constructor } from "../../../../types";

/**
 * Interface voor metadata storage
 */
export interface IMetadataStorage {
  /**
   * Haal alle opgeslagen metadata op
   */
  getMetadata<T = any>(key: symbol): Map<Constructor, T>;

  /**
   * Haal metadata op voor een specifieke target
   */
  getTargetMetadata<T = any>(key: symbol, target: Constructor): T | undefined;

  /**
   * Sla metadata op
   */
  setMetadata<T = any>(key: symbol, target: Constructor, metadata: T): void;

  /**
   * Verwijder metadata
   */
  deleteMetadata(key: symbol, target: Constructor): void;

  /**
   * Controleer of metadata bestaat
   */
  hasMetadata(key: symbol, target: Constructor): boolean;
}

/**
 * Property metadata voor injectie decorators
 */
export interface PropertyMetadata {
  /**
   * Property naam
   */
  propertyKey: string | symbol;

  /**
   * Property type (constructor of injectie token)
   */
  type: Constructor | symbol;

  /**
   * Is deze dependency optioneel?
   */
  isOptional?: boolean;
}

/**
 * Parameter metadata voor constructor injectie
 */
export interface ParameterMetadata {
  /**
   * Parameter index
   */
  index: number;

  /**
   * Parameter type (constructor of injectie token)
   */
  type: Constructor | symbol;

  /**
   * Is deze parameter optioneel?
   */
  isOptional?: boolean;
}

/**
 * Service dependency metadata
 */
export interface DependencyMetadata<
  TService extends IBaseService = IBaseService,
  TDeps extends IServiceDependencies = IServiceDependencies
> {
  /**
   * Property injecties
   */
  properties: PropertyMetadata[];

  /**
   * Constructor parameter injecties
   */
  parameters: ParameterMetadata[];

  /**
   * Service configuratie type
   */
  configType?: Constructor;

  /**
   * Dependencies interface type
   */
  depsType?: Constructor<TDeps>;
}

/**
 * Metadata keys voor verschillende types metadata
 */
export const PROPERTY_METADATA_KEY = Symbol('PropertyMetadata');
export const PARAMETER_METADATA_KEY = Symbol('ParameterMetadata');
export const CONFIG_TYPE_METADATA_KEY = Symbol('ConfigType');
export const DEPS_TYPE_METADATA_KEY = Symbol('DepsType');