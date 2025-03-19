import { BaseRepository, IBaseRepository } from './base.repository';
import { Server, ServerDocument } from '../models/Server';

export interface IServerRepository extends IBaseRepository<ServerDocument> {
  findByDiscordId(discordServerId: string): Promise<ServerDocument | null>;
  updateSettings(discordServerId: string, settings: Partial<ServerDocument['settings']>): Promise<ServerDocument | null>;
  findByNotificationChannel(channelId: string): Promise<ServerDocument | null>;
  findByLanguage(language: string): Promise<ServerDocument[]>;
}

export class ServerRepository extends BaseRepository<ServerDocument> implements IServerRepository {
  constructor() {
    super(Server);
  }

  async findByDiscordId(discordServerId: string): Promise<ServerDocument | null> {
    return await this.findOne({ discord_server_id: discordServerId });
  }

  async updateSettings(
    discordServerId: string,
    settings: Partial<ServerDocument['settings']>
  ): Promise<ServerDocument | null> {
    return await this.model.findOneAndUpdate(
      { discord_server_id: discordServerId },
      { 
        $set: {
          'settings': {
            ...settings,
            updated_at: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  async findByNotificationChannel(channelId: string): Promise<ServerDocument | null> {
    return await this.findOne({
      'settings.notification_channel': channelId
    });
  }

  async findByLanguage(language: string): Promise<ServerDocument[]> {
    return await this.find({
      'settings.language': language
    });
  }
}

// Create singleton instance
export const serverRepository = new ServerRepository();

// Export a type containing all repositories for dependency injection
export interface IRepositories {
  userRepository: IBaseRepository<ServerDocument>;
  taskRepository: IBaseRepository<ServerDocument>;
  categoryRepository: IBaseRepository<ServerDocument>;
  serverRepository: IBaseRepository<ServerDocument>;
}