import { IBaseService, IServiceDependencies } from "../../interfaces/base/service.interface";
import { Constructor } from "../../../../types";

/**
 * Service lifecycle scope types
 */
export enum ServiceScope {
  /**
   * Één instantie voor de hele applicatie
   */
  SINGLETON = 'singleton',

  /**
   * Nieuwe instantie per resolve
   */
  TRANSIENT = 'transient',

  /**
   * Één instantie binnen een bepaalde scope/context
   */
  SCOPED = 'scoped'
}

/**
 * Service registratie metadata
 */
export interface ServiceRegistration<
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
   * Service dependencies
   */
  dependencies: TDeps;

  /**
   * Service configuratie
   */
  config?: unknown;

  /**
   * Service tokens voor dependency injection
   */
  tokens?: symbol[];
}

/**
 * Interface voor de service container
 */
export interface IServiceContainer {
  /**
   * Registreer een nieuwe service
   * 
   * @param registration - Service registratie metadata
   */
  register<TService extends IBaseService>(
    registration: ServiceRegistration<TService>
  ): void;

  /**
   * Resolve een service instantie
   * 
   * @param token - Service token of constructor
   * @param scope - Optionele scope identifier voor scoped services
   */
  resolve<TService extends IBaseService>(
    token: symbol | Constructor<TService>,
    scope?: string
  ): TService;

  /**
   * Controleer of een service geregistreerd is
   * 
   * @param token - Service token of constructor
   */
  has(token: symbol | Constructor<IBaseService>): boolean;

  /**
   * Start het initialisatie proces voor alle geregistreerde services
   */
  initialize(): Promise<void>;

  /**
   * Cleanup en dispose alle service instanties
   */
  dispose(): Promise<void>;
}