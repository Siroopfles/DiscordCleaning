import { BaseService } from '../../base.service';
import { DiscordClient } from '../../../types';
import { IManagementService, ManagementServiceType, ServiceStatus } from './types';

/**
 * Abstracte basis class voor management services
 * Implementeert de basis functionaliteit voor service management
 */
export abstract class AbstractManagementService extends BaseService implements IManagementService {
  private lastStatus: ServiceStatus | null = null;
  
  constructor(
    protected readonly client: DiscordClient,
    private readonly _serviceName: string,
    private readonly _serviceType: ManagementServiceType
  ) {
    super(client);
  }

  /**
   * Naam van de service
   */
  get serviceName(): string {
    return this._serviceName;
  }

  /**
   * Type van de service
   */
  get serviceType(): ManagementServiceType {
    return this._serviceType;
  }

  /**
   * Herinitialisatie functionaliteit voor recovery
   */
  async reinitialize(): Promise<void> {
    this.log('info', `Reinitializing service: ${this.serviceName}`);
    try {
      await this.destroy();
      await this.initialize();
      this.log('info', `Successfully reinitialized service: ${this.serviceName}`);
    } catch (error) {
      this.log('error', `Failed to reinitialize service: ${this.serviceName}`, error);
      throw error;
    }
  }

  /**
   * Service status ophalen
   */
  async getStatus(): Promise<ServiceStatus> {
    try {
      const healthy = await this.checkHealth();
      const status: ServiceStatus = {
        healthy,
        status: healthy ? 'active' : 'error',
        lastCheck: new Date(),
        metrics: await this.getMetrics()
      };
      this.lastStatus = status;
      return status;
    } catch (error) {
      const errorStatus: ServiceStatus = {
        healthy: false,
        status: 'error',
        lastCheck: new Date(),
        metrics: {
          errorRate: 1.0
        }
      };
      this.lastStatus = errorStatus;
      return errorStatus;
    }
  }

  /**
   * Service opruimen voor shutdown
   */
  async destroy(): Promise<void> {
    this.log('info', `Destroying service: ${this.serviceName}`);
    await this.onDestroy();
  }

  /**
   * Health check implementatie - kan worden overschreven
   */
  protected async checkHealth(): Promise<boolean> {
    return true;
  }

  /**
   * Metrics ophalen - kan worden overschreven
   */
  protected async getMetrics(): Promise<ServiceStatus['metrics']> {
    return {};
  }

  /**
   * Cleanup hook - kan worden overschreven
   */
  protected async onDestroy(): Promise<void> {
    // Default implementatie doet niets
  }

  /**
   * Moet geïmplementeerd worden door concrete services
   */
  protected abstract initialize(): Promise<void>;
}