import { BaseRepository, IBaseRepository } from './base.repository';
import { User, UserDocument } from '../models/User';

import {
  UpdateSettingsDto,
  UpdateNotificationSettingsDto,
  UpdateTaskManagementSettingsDto,
  UpdateGamificationSettingsDto
} from '../types/validation';

export interface IUserRepository extends IBaseRepository<UserDocument> {
  findByDiscordId(discordId: string): Promise<UserDocument | null>;
  updateSettings(discordId: string, settings: UpdateSettingsDto): Promise<UserDocument | null>;
  updateNotificationSettings(discordId: string, settings: UpdateNotificationSettingsDto): Promise<UserDocument | null>;
  updateTaskManagementSettings(discordId: string, settings: UpdateTaskManagementSettingsDto): Promise<UserDocument | null>;
  updateGamificationSettings(discordId: string, settings: UpdateGamificationSettingsDto): Promise<UserDocument | null>;
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
    settings: UpdateSettingsDto
  ): Promise<UserDocument | null> {
    const updateData: { [key: string]: any } = {};
    
    // Only include defined fields in the update
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`settings.${key}`] = value;
      }
    });

    return await this.model.findOneAndUpdate(
      { discord_id: discordId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateNotificationSettings(
    discordId: string,
    settings: UpdateNotificationSettingsDto
  ): Promise<UserDocument | null> {
    const updateData: { [key: string]: any } = {};
    
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'notificationTypes') {
          Object.entries(value).forEach(([typeKey, typeValue]) => {
            updateData[`settings.notifications.notificationTypes.${typeKey}`] = typeValue;
          });
        } else {
          updateData[`settings.notifications.${key}`] = value;
        }
      }
    });

    return await this.model.findOneAndUpdate(
      { discord_id: discordId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateTaskManagementSettings(
    discordId: string,
    settings: UpdateTaskManagementSettingsDto
  ): Promise<UserDocument | null> {
    const updateData: { [key: string]: any } = {};
    
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`settings.taskManagement.${key}`] = value;
      }
    });

    return await this.model.findOneAndUpdate(
      { discord_id: discordId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateGamificationSettings(
    discordId: string,
    settings: UpdateGamificationSettingsDto
  ): Promise<UserDocument | null> {
    const updateData: { [key: string]: any } = {};
    
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`settings.gamification.${key}`] = value;
      }
    });

    return await this.model.findOneAndUpdate(
      { discord_id: discordId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }
}

// Create singleton instance
export const userRepository = new UserRepository();