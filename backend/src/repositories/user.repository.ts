import { BaseRepository, IBaseRepository } from './base.repository';
import { User, UserDocument } from '../models/User';

export interface IUserRepository extends IBaseRepository<UserDocument> {
  findByDiscordId(discordId: string): Promise<UserDocument | null>;
  updateSettings(discordId: string, settings: Partial<UserDocument['settings']>): Promise<UserDocument | null>;
}

export class UserRepository extends BaseRepository<UserDocument> implements IUserRepository {
  constructor() {
    super(User);
  }

  async findByDiscordId(discordId: string): Promise<UserDocument | null> {
    return await this.findOne({ discord_id: discordId });
  }

  async updateSettings(
    discordId: string, 
    settings: Partial<UserDocument['settings']>
  ): Promise<UserDocument | null> {
    return await this.model.findOneAndUpdate(
      { discord_id: discordId },
      { $set: { 'settings': { ...settings } } },
      { new: true, runValidators: true }
    ).exec();
  }
}

// Create singleton instance
export const userRepository = new UserRepository();