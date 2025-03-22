import { Constructor } from "../../../types";
import { IBaseService, IServiceDependencies } from "../interfaces/base/service.interface";
import { IServiceContainer, ServiceRegistration, ServiceScope } from "./interfaces/container.interface";
import { ServiceMetadata, SERVICE_METADATA_KEY } from "./interfaces/decorator.interface";
import { PropertyMetadata, ParameterMetadata, PROPERTY_METADATA_KEY, PARAMETER_METADATA_KEY } from "./interfaces/metadata.interface";
import { MetadataStorage } from "./metadata";

/**
 * Error class voor circulaire dependencies
 */
class CircularDependencyError extends Error {
  constructor(chain: string[]) {
    super(`Circulaire dependency gedetecteerd: ${chain.join(' -> ')}`);
  }
}

/**
 * Service container implementatie
 */
export class ServiceContainer implements IServiceContainer {
  // Map voor service registraties
  private readonly registrations = new Map<symbol | Constructor, ServiceRegistration>();
  
  // Map voor singleton instanties
  private readonly singletons = new Map<symbol | Constructor, IBaseService>();
  
  // Map voor scoped instanties
  private readonly scopedInstances = new Map<string, Map<symbol | Constructor, IBaseService>>();
  
  // Set voor services die momenteel worden geïnstantieerd (voor circulaire dependency detectie)
  private readonly instantiating = new Set<symbol | Constructor>();

  /**
   * Registreer een nieuwe service
   */
  public register<TService extends IBaseService>(
    registration: ServiceRegistration<TService>
  ): void {
    for (const token of registration.tokens || []) {
      this.registrations.set(token, registration);
    }
    this.registrations.set(registration.ctor, registration);
  }

  /**
   * Resolve een service instantie
   */
  public resolve<TService extends IBaseService>(
    token: symbol | Constructor<TService>,
    scope?: string
  ): TService {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new Error(`Service niet gevonden voor token: ${token.toString()}`);
    }

    // Check voor circulaire dependencies
    if (this.instantiating.has(token)) {
      const chain = Array.from(this.instantiating).map(t => 
        t instanceof Function ? t.name : t.toString()
      );
      chain.push(token instanceof Function ? token.name : token.toString());
      throw new CircularDependencyError(chain);
    }

    // Zoek bestaande instantie
    const instance = this.findInstance(registration, scope);
    if (instance) {
      return instance as TService;
    }

    // Creëer nieuwe instantie
    return this.createInstance(registration, scope) as TService;
  }

  /**
   * Controleer of een service geregistreerd is
   */
  public has(token: symbol | Constructor<IBaseService>): boolean {
    return this.registrations.has(token);
  }

  /**
   * Start het initialisatie proces voor alle services
   */
  public async initialize(): Promise<void> {
    // Initialiseer services in volgorde van dependencies
    const initialized = new Set<symbol | Constructor>();
    const promises: Promise<void>[] = [];

    for (const [token] of this.registrations) {
      if (!initialized.has(token)) {
        promises.push(this.initializeService(token, initialized));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Cleanup alle service instanties
   */
  public async dispose(): Promise<void> {
    // Roep destroy aan op alle instanties
    const promises: Promise<void>[] = [];

    // Dispose singletons
    for (const instance of this.singletons.values()) {
      if (instance.destroy) {
        promises.push(instance.destroy());
      }
    }

    // Dispose scoped instances
    for (const scope of this.scopedInstances.values()) {
      for (const instance of scope.values()) {
        if (instance.destroy) {
          promises.push(instance.destroy());
        }
      }
    }

    await Promise.all(promises);

    // Clear alle instances
    this.singletons.clear();
    this.scopedInstances.clear();
  }

  /**
   * Vind een bestaande service instantie
   */
  private findInstance<TService extends IBaseService>(
    registration: ServiceRegistration<TService>,
    scope?: string
  ): TService | undefined {
    if (registration.scope === ServiceScope.SINGLETON) {
      return this.singletons.get(registration.ctor) as TService;
    }

    if (registration.scope === ServiceScope.SCOPED && scope) {
      const scopedMap = this.scopedInstances.get(scope);
      return scopedMap?.get(registration.ctor) as TService;
    }

    return undefined;
  }

  /**
   * Creëer een nieuwe service instantie
   */
  private createInstance<TService extends IBaseService>(
    registration: ServiceRegistration<TService>,
    scope?: string
  ): TService {
    this.instantiating.add(registration.ctor);

    try {
      // Haal constructor parameters op
      const paramMetadata = MetadataStorage.getInstance()
        .getTargetMetadata<ParameterMetadata[]>(PARAMETER_METADATA_KEY, registration.ctor) || [];

      // Resolve constructor parameters
      const params = paramMetadata.map(param => {
        try {
          return this.resolve(param.type, scope);
        } catch (error) {
          if (!param.isOptional) throw error;
          return undefined;
        }
      });

      // Creëer instantie
      const instance = new registration.ctor(...params);

      // Injecteer property dependencies
      const propMetadata = MetadataStorage.getInstance()
        .getTargetMetadata<PropertyMetadata[]>(PROPERTY_METADATA_KEY, registration.ctor) || [];

      for (const prop of propMetadata) {
        try {
          const dependency = this.resolve(prop.type, scope);
          (instance as any)[prop.propertyKey] = dependency;
        } catch (error) {
          if (!prop.isOptional) throw error;
        }
      }

      // Sla instantie op
      this.storeInstance(registration, instance, scope);

      return instance;
    } finally {
      this.instantiating.delete(registration.ctor);
    }
  }

  /**
   * Sla een service instantie op
   */
  private storeInstance<TService extends IBaseService>(
    registration: ServiceRegistration<TService>,
    instance: TService,
    scope?: string
  ): void {
    if (registration.scope === ServiceScope.SINGLETON) {
      this.singletons.set(registration.ctor, instance);
      return;
    }

    if (registration.scope === ServiceScope.SCOPED && scope) {
      let scopedMap = this.scopedInstances.get(scope);
      if (!scopedMap) {
        scopedMap = new Map();
        this.scopedInstances.set(scope, scopedMap);
      }
      scopedMap.set(registration.ctor, instance);
    }
  }

  /**
   * Initialiseer een service en zijn dependencies
   */
  private async initializeService(
    token: symbol | Constructor,
    initialized: Set<symbol | Constructor>
  ): Promise<void> {
    if (initialized.has(token)) return;

    const registration = this.registrations.get(token);
    if (!registration) return;

    // Initialiseer dependencies eerst
    const metadata = MetadataStorage.getInstance()
      .getTargetMetadata<ServiceMetadata>(SERVICE_METADATA_KEY, registration.ctor);

    if (metadata) {
      const paramTypes = Reflect.getMetadata('design:paramtypes', registration.ctor) || [];
      for (const paramType of paramTypes) {
        await this.initializeService(paramType, initialized);
      }
    }

    // Creëer en initialiseer service
    const instance = this.resolve(token);
    if (instance.initialize) {
      await instance.initialize();
    }

    initialized.add(token);
  }
}