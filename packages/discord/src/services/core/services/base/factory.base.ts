import 'reflect-metadata';
import { container } from 'tsyringe';
import { IServiceFactory, IServiceConstructor } from '../../interfaces/base/factory.interface';
import { IBaseService, IServiceDependencies } from '../../interfaces/base/service.interface';

/**
 * Basis factory implementatie voor services
 * Handelt dependency injection en service instantiatie
 * 
 * @template TService - Type van de services die gecreëerd worden
 * @template TDependencies - Type van de service dependencies
 * @template TConfig - Type van de service configuratie
 */
export class ServiceFactory<
  TService extends IBaseService = IBaseService,
  TDependencies extends IServiceDependencies = IServiceDependencies,
  TConfig = unknown
> implements IServiceFactory<TService, TDependencies, TConfig> {
  
  private readonly serviceInstances = new Map<string, TService>();
  private readonly dependencies: TDependencies;

  constructor(dependencies: TDependencies) {
    this.dependencies = dependencies;

    // Registreer dependencies in DI container
    Object.entries(dependencies).forEach(([key, value]) => {
      container.register(key, { useValue: value });
    });
  }

  /**
   * Creëer een nieuwe service instantie
   * 
   * @param constructor - Service constructor
   * @param config - Optionele service configuratie
   * @returns Een nieuwe service instantie
   */
  public createService(
    constructor: IServiceConstructor<TService, TDependencies, TConfig>,
    config?: TConfig
  ): TService {
    // Creëer nieuwe service instantie met dependencies en config
    const service = new constructor(this.dependencies, config);

    // Initialiseer de service
    service.initialize().catch((error) => {
      service.log('error', `Failed to initialize service: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    });

    return service;
  }

  /**
   * Registreer een service in de factory
   * 
   * @param serviceId - Unieke service identifier
   * @param constructor - Service constructor
   * @param config - Optionele service configuratie
   */
  public registerService(
    serviceId: string,
    constructor: IServiceConstructor<TService, TDependencies, TConfig>,
    config?: TConfig
  ): void {
    // Check of service ID al geregistreerd is
    if (this.serviceInstances.has(serviceId)) {
      throw new Error(`Service with ID '${serviceId}' is already registered`);
    }

    // Creëer en cache service instantie
    const service = this.createService(constructor, config);
    this.serviceInstances.set(serviceId, service);
  }

  /**
   * Haal een geregistreerde service op
   * 
   * @param serviceId - Service identifier
   * @returns De geregistreerde service of undefined
   */
  public getService(serviceId: string): TService | undefined {
    return this.serviceInstances.get(serviceId);
  }

  /**
   * Update de dependencies van alle geregistreerde services
   * 
   * @param dependencies - Nieuwe dependency waardes
   */
  public async updateDependencies(dependencies: Partial<TDependencies>): Promise<void> {
    // Update factory dependencies
    Object.assign(this.dependencies, dependencies);

    // Update dependencies in DI container
    Object.entries(dependencies).forEach(([key, value]) => {
      container.register(key, { useValue: value });
    });

    // Update alle geregistreerde services
    const updatePromises = Array.from(this.serviceInstances.values()).map(
      service => service.updateDependencies(dependencies)
    );

    await Promise.all(updatePromises);
  }

  /**
   * Verwijder een geregistreerde service
   * 
   * @param serviceId - Service identifier
   */
  public async unregisterService(serviceId: string): Promise<void> {
    const service = this.serviceInstances.get(serviceId);
    if (service) {
      await service.destroy();
      this.serviceInstances.delete(serviceId);
    }
  }

  /**
   * Verwijder alle geregistreerde services
   */
  public async dispose(): Promise<void> {
    const disposePromises = Array.from(this.serviceInstances.values()).map(
      service => service.destroy()
    );

    await Promise.all(disposePromises);
    this.serviceInstances.clear();
  }
}