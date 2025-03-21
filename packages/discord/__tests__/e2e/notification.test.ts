import { Client, TextChannel } from 'discord.js';
import { NotificationService } from '../../src/services/notification.service';
import { DiscordClient, DiscordConfig, Logger } from '../../src/types';
import { NotificationOptions, NotificationType } from '../../src/types/notification';
import { v4 as uuidv4 } from 'uuid';

// Mock setup
const MockClient = Client as unknown as jest.Mock;
const MockTextChannel = TextChannel as unknown as jest.Mock;

jest.mock('discord.js', () => ({
  Client: jest.fn(),
  TextChannel: jest.fn()
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

describe('Notification Service E2E Tests', () => {
  let client: DiscordClient;
  let notificationService: NotificationService;
  let mockChannel: jest.Mocked<TextChannel>;

  const mockConfig: DiscordConfig = {
    token: 'test-token',
    clientId: 'test-client-id',
    guildId: 'test-guild-id'
  };

  const mockLogger: Logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock channel
    mockChannel = {
      send: jest.fn().mockResolvedValue({}),
      id: 'test-channel-id'
    } as unknown as jest.Mocked<TextChannel>;

    // Setup mock client
    client = {
      config: mockConfig,
      services: { logger: mockLogger },
      channels: {
        cache: new Map([['test-channel-id', mockChannel]]),
        fetch: jest.fn().mockResolvedValue(mockChannel)
      }
    } as unknown as DiscordClient;

    notificationService = new NotificationService(client);
  });

  it('should send discord message notification', async () => {
    const notificationData = {
      channelId: 'test-channel-id',
      content: 'Test notification',
      guildId: mockConfig.guildId as string
    };

    const options: NotificationOptions = {
      priority: 'high'
    };

    await notificationService.send(
      NotificationType.DISCORD_MESSAGE,
      notificationData,
      options
    );

    expect(mockChannel.send).toHaveBeenCalledWith({
      content: notificationData.content
    });
  });

  it('should handle non-existent channel', async () => {
    const notificationData = {
      channelId: 'non-existent-channel',
      content: 'Test notification',
      guildId: mockConfig.guildId as string
    };

    (client.channels.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Channel not found')
    );

    await expect(
      notificationService.send(NotificationType.DISCORD_MESSAGE, notificationData)
    ).rejects.toThrow('Channel not found');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send notification'),
      expect.any(Error)
    );
  });

  it('should handle message send failures', async () => {
    const notificationData = {
      channelId: 'test-channel-id',
      content: 'Test notification',
      guildId: mockConfig.guildId as string
    };

    mockChannel.send.mockRejectedValueOnce(new Error('Message send failed'));

    await expect(
      notificationService.send(NotificationType.DISCORD_MESSAGE, notificationData)
    ).rejects.toThrow('Message send failed');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send notification'),
      expect.any(Error)
    );
  });

  it('should handle rate limiting', async () => {
    const notificationData = {
      channelId: 'test-channel-id',
      content: 'Test notification',
      guildId: mockConfig.guildId as string
    };

    // Simuleer rate limit error
    const rateLimitError = new Error('Rate limited');
    rateLimitError.name = 'RateLimitError';
    mockChannel.send.mockRejectedValueOnce(rateLimitError);

    await expect(
      notificationService.send(NotificationType.DISCORD_MESSAGE, notificationData)
    ).rejects.toThrow('Rate limit reached');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Rate limit reached'),
      expect.any(Error)
    );
  });

  it('should send task notifications', async () => {
    const taskNotificationData = {
      taskId: 'task-123',
      taskTitle: 'Test Task',
      action: 'created',
      guildId: mockConfig.guildId as string
    };

    await notificationService.send(
      NotificationType.TASK_CREATED,
      taskNotificationData
    );

    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Test Task'),
            description: expect.stringContaining('created')
          })
        ])
      })
    );
  });

  it('should batch multiple notifications', async () => {
    const notifications = [
      {
        channelId: 'test-channel-id',
        content: 'Notification 1',
        guildId: mockConfig.guildId as string
      },
      {
        channelId: 'test-channel-id',
        content: 'Notification 2',
        guildId: mockConfig.guildId as string
      }
    ];

    await Promise.all(
      notifications.map(n =>
        notificationService.send(NotificationType.DISCORD_MESSAGE, n)
      )
    );

    expect(mockChannel.send).toHaveBeenCalledTimes(2);
    expect(mockChannel.send).toHaveBeenNthCalledWith(1, {
      content: 'Notification 1'
    });
    expect(mockChannel.send).toHaveBeenNthCalledWith(2, {
      content: 'Notification 2'
    });
  });
});