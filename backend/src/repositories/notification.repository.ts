import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { BaseRepository } from './base.repository';
import Notification, { INotification } from '../models/Notification';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  async findPendingNotifications(channelType: string): Promise<INotification[]> {
    return this.find({
      status: 'PENDING',
      channelType,
    });
  }

  async markAsSent(notificationId: string): Promise<INotification | null> {
    return this.update(
      notificationId,
      {
        status: 'SENT',
        sentAt: new Date(),
      } as UpdateQuery<INotification>
    );
  }

  async markAsFailed(notificationId: string, error?: string): Promise<INotification | null> {
    return this.update(
      notificationId,
      {
        status: 'FAILED',
        'metadata.error': error,
      } as UpdateQuery<INotification>
    );
  }

  async findByUserAndStatus(
    userId: string,
    status?: string,
    limit = 10
  ): Promise<INotification[]> {
    const query: FilterQuery<INotification> = { userId };
    if (status) {
      query.status = status;
    }

    const options: QueryOptions = {
      limit,
      sort: { createdAt: -1 }
    };

    return this.find(query, options);
  }

  async createNotification(notificationData: Partial<INotification>): Promise<INotification> {
    return this.create({
      ...notificationData,
      status: 'PENDING',
    });
  }
}

export default new NotificationRepository();