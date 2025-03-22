import { IBaseService, IServiceDependencies } from '../interfaces/base/service.interface';
import { ServiceError } from '../errors/service.error';

export interface EventMetadata {
  timestamp: number;
  source: string;
  correlationId?: string;
  causationId?: string;
}

export interface Event<T = unknown> {
  type: string;
  payload: T;
  metadata: EventMetadata;
}

export type EventHandler<T = unknown> = (event: Event<T>) => Promise<void> | void;

export interface IEventBusConfig {
  maxListeners: number;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface IEventBusDependencies extends IServiceDependencies {
  publisher?: {
    publish(event: Event): Promise<void>;
  };
}

export class EventBusService implements IBaseService<IEventBusDependencies, IEventBusConfig> {
  public readonly serviceId = 'core:event-bus';
  
  private readonly _dependencies: IEventBusDependencies;
  private readonly _config: IEventBusConfig;
  private eventHandlers: Map<string, Set<EventHandler<any>>>;
  private correlationMap: Map<string, Set<string>>;

  constructor(
    dependencies: IEventBusDependencies,
    config: IEventBusConfig = {
      maxListeners: 10,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
    }
  ) {
    this._dependencies = dependencies;
    this._config = config;
    this.eventHandlers = new Map();
    this.correlationMap = new Map();
  }

  get dependencies(): IEventBusDependencies {
    return this._dependencies;
  }

  get config(): IEventBusConfig {
    return this._config;
  }

  public async initialize(): Promise<void> {
    try {
      this.log('info', 'EventBusService initialized successfully');
    } catch (error) {
      throw new ServiceError(
        'Failed to initialize event bus service',
        {
          service: this.serviceId,
          operation: 'initialize',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        }
      );
    }
  }

  /**
   * Registreer een event handler voor een specifiek event type
   */
  public on<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set<EventHandler<any>>());
    }

    const handlers = this.eventHandlers.get(eventType)!;
    if (handlers.size >= this.config.maxListeners) {
      throw new ServiceError(
        `Maximum listeners (${this.config.maxListeners}) exceeded for event type: ${eventType}`,
        {
          service: this.serviceId,
          operation: 'on',
          metadata: { eventType, currentListeners: handlers.size }
        }
      );
    }

    handlers.add(handler);
    this.log('debug', `Registered handler for event type: ${eventType}`);
  }

  /**
   * Verwijder een event handler voor een specifiek event type
   */
  public off<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      // Type casting om type safety te behouden
      handlers.delete(handler as EventHandler<any>);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
      this.log('debug', `Removed handler for event type: ${eventType}`);
    }
  }

  /**
   * Emit een event naar alle geregistreerde handlers
   */
  public async emit<T = unknown>(
    type: string,
    payload: T,
    correlationId?: string,
    causationId?: string
  ): Promise<void> {
    const event: Event<T> = {
      type,
      payload,
      metadata: {
        timestamp: Date.now(),
        source: this.serviceId,
        correlationId,
        causationId
      }
    };

    try {
      // Publish naar externe publisher als beschikbaar
      if (this.dependencies.publisher) {
        await this.dependencies.publisher.publish(event);
      }

      // Handle lokaal
      await this.handleEvent(event);

      // Update correlation tracking
      if (correlationId) {
        if (!this.correlationMap.has(correlationId)) {
          this.correlationMap.set(correlationId, new Set());
        }
        if (causationId) {
          this.correlationMap.get(correlationId)!.add(causationId);
        }
      }
    } catch (error) {
      throw new ServiceError(
        `Failed to emit event: ${type}`,
        {
          service: this.serviceId,
          operation: 'emit',
          metadata: {
            eventType: type,
            correlationId,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      );
    }
  }

  /**
   * Krijg alle gerelateerde events voor een correlationId
   */
  public getCorrelatedEvents(correlationId: string): string[] {
    const related = this.correlationMap.get(correlationId);
    return related ? Array.from(related) : [];
  }

  public async updateConfig(config: Partial<IEventBusConfig>): Promise<void> {
    // Valideer nieuwe configuratie
    if (config.maxListeners && config.maxListeners < this.eventHandlers.size) {
      throw new ServiceError(
        'Cannot reduce maxListeners below current listener count',
        {
          service: this.serviceId,
          operation: 'updateConfig',
          metadata: {
            currentListeners: this.eventHandlers.size,
            requestedMax: config.maxListeners
          }
        }
      );
    }

    Object.assign(this._config, config);
    this.log('info', 'EventBusService configuration updated');
  }

  public async updateDependencies(deps: Partial<IEventBusDependencies>): Promise<void> {
    Object.assign(this._dependencies, deps);
    this.log('info', 'EventBusService dependencies updated');
  }

  public async destroy(): Promise<void> {
    this.eventHandlers.clear();
    this.correlationMap.clear();
    this.log('info', 'EventBusService destroyed successfully');
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void {
    if (this.dependencies.logger) {
      this.dependencies.logger[level](message, ...args);
    }
  }

  private async handleEvent<T>(event: Event<T>): Promise<void> {
    const handlers = this.eventHandlers.get(event.type);
    if (!handlers) return;

    const errors: Error[] = [];
    let retryCount = 0;

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        if (this.config.enableRetry && retryCount < this.config.maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          try {
            await handler(event);
          } catch (retryError) {
            errors.push(retryError as Error);
          }
        } else {
          errors.push(error as Error);
        }
      }
    }

    if (errors.length > 0) {
      throw new ServiceError(
        `Failed to handle event: ${event.type}`,
        {
          service: this.serviceId,
          operation: 'handleEvent',
          metadata: {
            eventType: event.type,
            errors: errors.map(e => e.message)
          }
        }
      );
    }
  }
}