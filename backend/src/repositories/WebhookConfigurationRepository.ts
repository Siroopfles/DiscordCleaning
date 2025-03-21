import { BaseRepository, IBaseRepository } from './base.repository';
import WebhookConfiguration, { WebhookConfiguration as IWebhookConfiguration } from '../models/WebhookConfiguration';

export interface IWebhookConfigurationRepository extends IBaseRepository<IWebhookConfiguration> {
  findByEvent(event: string): Promise<IWebhookConfiguration[]>;
  findEnabled(): Promise<IWebhookConfiguration[]>;
}

export class WebhookConfigurationRepository extends BaseRepository<IWebhookConfiguration> implements IWebhookConfigurationRepository {
  constructor() {
    super(WebhookConfiguration);
  }

  async findByEvent(event: string): Promise<IWebhookConfiguration[]> {
    return await this.model.find({
      events: event,
      enabled: true
    }).exec();
  }

  async findEnabled(): Promise<IWebhookConfiguration[]> {
    return await this.model.find({
      enabled: true
    }).exec();
  }
}

export default new WebhookConfigurationRepository();