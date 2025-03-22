import { IBaseService, IServiceDependencies } from './service.interface';

/**
 * Interface voor type-safe service constructie
 * 
 * @template TService - Type van de service die geconstrueerd wordt
 * @template TDependencies - Type van de service dependencies
 * @template TConfig - Type van de service configuratie
 */
export interface IServiceConstructor<
  TService extends IBaseService = IBaseService,
  TDependencies extends IServiceDependencies = IServiceDependencies,
  TConfig = unknown
> {
  new (dependencies: TDependencies, config?: TConfig): TService;
}

/**
 * Interface voor service factory pattern implementatie
 * 
 * @template TService - Type van de service die gecreëerd wordt
 * @template TDependencies - Type van de service dependencies
 * @template TConfig - Type van de service configuratie
 */
export interface IServiceFactory<
  TService extends IBaseService = IBaseService,
  TDependencies extends IServiceDependencies = IServiceDependencies,
  TConfig = unknown
> {
  /**
   * Creëer een nieuwe service instantie
   * 
   * @param constructor - Service constructor
   * @param config - Optionele service configuratie
   * @returns Een nieuwe service instantie
   */
  createService(
    constructor: IServiceConstructor<TService, TDependencies, TConfig>,
    config?: TConfig
  ): TService;

  /**
   * Registreer een service in de factory
   * 
   * @param serviceId - Unieke service identifier
   * @param constructor - Service constructor
   * @param config - Optionele service configuratie
   */
  registerService(
    serviceId: string,
    constructor: IServiceConstructor<TService, TDependencies, TConfig>,
    config?: TConfig
  ): void;

  /**
   * Haal een geregistreerde service op
   * 
   * @param serviceId - Service identifier
   * @returns De geregistreerde service of undefined
   */
  getService(serviceId: string): TService | undefined;
}