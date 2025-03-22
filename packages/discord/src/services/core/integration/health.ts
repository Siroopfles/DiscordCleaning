import { IBaseService, IServiceDependencies } from '../interfaces/base/service.interface';
import { ServiceError } from '../errors/service.error';
import { HealthStatus, ComponentHealth } from './types';

export interface HealthCheck {
  name: string;
  check(): Promise<ComponentHealth>;
  interval: number; // milliseconds
}

export interface IHealthConfig {
  enableAutoChecks: boolean;
  checkInterval: number; // milliseconds
  timeoutThreshold: number; // milliseconds
}

export interface IHealthDependencies extends IServiceDependencies {
  checks?: HealthCheck[];
  onStatusChange?: (status: HealthStatus) => void;
}

export class HealthService implements IBaseService<IHealthDependencies, IHealthConfig> {
  public readonly serviceId = 'core:health';

  private readonly _dependencies: IHealthDependencies;
  private readonly _config: IHealthConfig;
  private healthStatus: HealthStatus;
  private checkIntervals: Map<string, NodeJS.Timeout>;
  private lastCheckTimes: Map<string, number>;

  constructor(
    dependencies: IHealthDependencies,
    config: IHealthConfig = {
      enableAutoChecks: true,
      checkInterval: 30000,
      timeoutThreshold: 5000
    }
  ) {
    this._dependencies = dependencies;
    this._config = config;
    this.healthStatus = {
      status: 'healthy',
      lastCheck: Date.now(),
      details: {}
    };
    this.checkIntervals = new Map();
    this.lastCheckTimes = new Map();
  }

  get dependencies(): IHealthDependencies {
    return this._dependencies;
  }

  get config(): IHealthConfig {
    return this._config;
  }

  public async initialize(): Promise<void> {
    try {
      if (this.config.enableAutoChecks && this.dependencies.checks) {
        await this.startHealthChecks();
      }
      this.log('info', 'HealthService initialized successfully');
    } catch (error) {
      throw new ServiceError(
        'Failed to initialize health service',
        {
          service: this.serviceId,
          operation: 'initialize',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        }
      );
    }
  }

  /**
   * Voer een specifieke health check uit
   */
  public async runCheck(checkName: string): Promise<ComponentHealth> {
    const check = this.dependencies.checks?.find(c => c.name === checkName);
    if (!check) {
      throw new ServiceError(
        `Health check not found: ${checkName}`,
        {
          service: this.serviceId,
          operation: 'runCheck',
          metadata: { checkName }
        }
      );
    }

    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<ComponentHealth>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Health check timed out after ${this.config.timeoutThreshold}ms`));
      }, this.config.timeoutThreshold);
    });

    try {
      const startTime = Date.now();
      const result = await Promise.race([
        check.check(),
        timeoutPromise
      ]);

      clearTimeout(timeoutHandle!);
      this.lastCheckTimes.set(checkName, startTime);
      this.updateHealthStatus(checkName, result);

      return result;
    } catch (error) {
      clearTimeout(timeoutHandle!);
      const degradedStatus: ComponentHealth = {
        status: 'degraded',
        lastUpdate: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateHealthStatus(checkName, degradedStatus);
      return degradedStatus;
    }
  }

  /**
   * Voer alle geregistreerde health checks uit
   */
  public async runAllChecks(): Promise<HealthStatus> {
    if (!this.dependencies.checks) {
      return this.healthStatus;
    }

    const checkPromises = this.dependencies.checks.map(check => 
      this.runCheck(check.name)
    );

    await Promise.all(checkPromises);
    return this.getStatus();
  }

  /**
   * Krijg de huidige health status
   */
  public getStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Registreer een nieuwe health check
   */
  public registerCheck(check: HealthCheck): void {
    if (!this.dependencies.checks) {
      this._dependencies.checks = [];
    }

    (this._dependencies.checks as HealthCheck[]).push(check);
    
    if (this.config.enableAutoChecks) {
      this.startCheckInterval(check);
    }

    this.log('info', `Registered new health check: ${check.name}`);
  }

  /**
   * Verwijder een health check
   */
  public unregisterCheck(checkName: string): void {
    if (!this.dependencies.checks) return;

    const index = this.dependencies.checks.findIndex(c => c.name === checkName);
    if (index > -1) {
      this.dependencies.checks.splice(index, 1);
      this.stopCheckInterval(checkName);
      this.log('info', `Unregistered health check: ${checkName}`);
    }
  }

  public async updateConfig(config: Partial<IHealthConfig>): Promise<void> {
    Object.assign(this._config, config);
    
    if (this.dependencies.checks) {
      // Reset alle check intervals met nieuwe configuratie
      await this.stopHealthChecks();
      if (this.config.enableAutoChecks) {
        await this.startHealthChecks();
      }
    }
  }

  public async updateDependencies(deps: Partial<IHealthDependencies>): Promise<void> {
    // Stop huidige checks
    await this.stopHealthChecks();

    // Update dependencies
    Object.assign(this._dependencies, deps);

    // Herstart checks indien nodig
    if (this.config.enableAutoChecks && this.dependencies.checks) {
      await this.startHealthChecks();
    }
  }

  public async destroy(): Promise<void> {
    await this.stopHealthChecks();
    this.lastCheckTimes.clear();
    this.log('info', 'HealthService destroyed successfully');
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void {
    if (this.dependencies.logger) {
      this.dependencies.logger[level](message, ...args);
    }
  }

  private async startHealthChecks(): Promise<void> {
    if (!this.dependencies.checks) return;

    for (const check of this.dependencies.checks) {
      this.startCheckInterval(check);
    }
  }

  private startCheckInterval(check: HealthCheck): void {
    // Stop bestaande interval als die er is
    this.stopCheckInterval(check.name);

    // Start nieuwe interval
    const interval = setInterval(
      () => this.runCheck(check.name),
      check.interval || this.config.checkInterval
    );
    
    this.checkIntervals.set(check.name, interval);
  }

  private stopCheckInterval(checkName: string): void {
    const interval = this.checkIntervals.get(checkName);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(checkName);
    }
  }

  private async stopHealthChecks(): Promise<void> {
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
  }

  private updateHealthStatus(checkName: string, status: ComponentHealth): void {
    // Update component status
    this.healthStatus.details[checkName] = status;

    // Update overall status
    const statuses = Object.values(this.healthStatus.details)
      .map(s => s.status);

    if (statuses.some(s => s === 'unhealthy')) {
      this.healthStatus.status = 'unhealthy';
    } else if (statuses.some(s => s === 'degraded')) {
      this.healthStatus.status = 'degraded';
    } else {
      this.healthStatus.status = 'healthy';
    }

    this.healthStatus.lastCheck = Date.now();

    // Notify status change if handler is provided
    if (this.dependencies.onStatusChange) {
      this.dependencies.onStatusChange(this.getStatus());
    }
  }
}