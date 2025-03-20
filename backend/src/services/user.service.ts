import { UserDocument } from '../models/User';
import { userRepository, IUserRepository } from '../repositories/user.repository';
import { 
  UpdateSettingsDto, 
  UpdateNotificationSettingsDto,
  UpdateTaskManagementSettingsDto,
  UpdateGamificationSettingsDto 
} from '../types/validation';

export class UserSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserSettingsError';
  }
}

export interface IUserService {
  findByDiscordId(discordId: string): Promise<UserDocument | null>;
  updateSettings(discordId: string, settings: UpdateSettingsDto): Promise<UserDocument>;
  updateNotificationSettings(discordId: string, settings: UpdateNotificationSettingsDto): Promise<UserDocument>;
  updateTaskManagementSettings(discordId: string, settings: UpdateTaskManagementSettingsDto): Promise<UserDocument>;
  updateGamificationSettings(discordId: string, settings: UpdateGamificationSettingsDto): Promise<UserDocument>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async findByDiscordId(discordId: string): Promise<UserDocument | null> {
    return await this.userRepository.findByDiscordId(discordId);
  }

  async updateSettings(discordId: string, settings: UpdateSettingsDto): Promise<UserDocument> {
    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      throw new UserSettingsError(`User with Discord ID ${discordId} not found`);
    }

    const updatedUser = await this.userRepository.updateSettings(discordId, settings);
    if (!updatedUser) {
      throw new UserSettingsError('Failed to update user settings');
    }

    return updatedUser;
  }

  async updateNotificationSettings(
    discordId: string,
    settings: UpdateNotificationSettingsDto
  ): Promise<UserDocument> {
    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      throw new UserSettingsError(`User with Discord ID ${discordId} not found`);
    }

    const updatedUser = await this.userRepository.updateNotificationSettings(discordId, settings);
    if (!updatedUser) {
      throw new UserSettingsError('Failed to update notification settings');
    }

    return updatedUser;
  }

  async updateTaskManagementSettings(
    discordId: string,
    settings: UpdateTaskManagementSettingsDto
  ): Promise<UserDocument> {
    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      throw new UserSettingsError(`User with Discord ID ${discordId} not found`);
    }

    // Validate defaultCategory if it's being updated
    if (settings.defaultCategory) {
      // TODO: Add category validation when CategoryRepository is available
      // const categoryExists = await categoryRepository.exists({ _id: settings.defaultCategory });
      // if (!categoryExists) {
      //   throw new UserSettingsError('Invalid default category specified');
      // }
    }

    const updatedUser = await this.userRepository.updateTaskManagementSettings(discordId, settings);
    if (!updatedUser) {
      throw new UserSettingsError('Failed to update task management settings');
    }

    return updatedUser;
  }

  async updateGamificationSettings(
    discordId: string,
    settings: UpdateGamificationSettingsDto
  ): Promise<UserDocument> {
    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      throw new UserSettingsError(`User with Discord ID ${discordId} not found`);
    }

    const updatedUser = await this.userRepository.updateGamificationSettings(discordId, settings);
    if (!updatedUser) {
      throw new UserSettingsError('Failed to update gamification settings');
    }

    return updatedUser;
  }
}

// Create singleton instance
export const userService = new UserService(userRepository);