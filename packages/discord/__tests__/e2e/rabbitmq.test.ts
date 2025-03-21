import { Client } from 'discord.js';
import { NotificationService } from '../../src/services/notification.service';
import { DiscordClient, DiscordConfig, Logger } from '../../src/types';
import { NotificationType } from '../../src/types/notification';
import { QueueConfig } from '../../src/types/queue';
import * as amqp from 'amqplib';

// Mock setup
jest.mock('amqplib', () => ({
  connect: jest.fn(),
  Channel: jest.fn(),
  Connection: jest.fn()
}));

jest.mock('discord.js', () => ({
  Client: jest.fn(),
  TextChannel: jest.fn()
}));

describe('RabbitMQ Integration E2E Tests', () => {
  let client: DiscordClient;
  let notificationService: NotificationService;
  let mockChannel: any;
  let mockConnection: any;
  let messageHandler: ((msg: any) => Promise<void>) | null = null;

  const mockConfig: DiscordConfig = {
    token: 'test-token',
    clientId: 'test-client-id',
    guildId: 'test-guild-id'
  };

  const queueConfig: QueueConfig = {
    url: 'amqp://localhost',
    queueName: 'test-queue',
    exchangeName: 'test-exchange'
  };

  const mockLogger: Logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    messageHandler = null;

    // Setup mock Discord client
    client = {
      config: mockConfig,
      services: { logger: mockLogger },
      channels: {
        cache: new Map(),
        fetch: jest.fn().mockResolvedValue({
          isTextBased: () => true,
          send: jest.fn().mockResolvedValue({})
        })
      }
    } as unknown as DiscordClient;

    // Setup mock RabbitMQ channel
    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue({ queue: queueConfig.queueName }),
      assertExchange: jest.fn().mockResolvedValue({ exchange: queueConfig.exchangeName }),
      bindQueue: jest.fn().mockResolvedValue({}),
      consume: jest.fn().mockImplementation((queue, callback) => {
        messageHandler = callback;
        return Promise.resolve({ consumerTag: 'test-consumer' });
      }),
      publish: jest.fn().mockReturnValue(true),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Setup mock RabbitMQ connection
    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined)
    };

    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

    notificationService = new NotificationService(client);
  });

  it('should connect to RabbitMQ and setup queues', async () => {
    await notificationService.setupMessageQueue(queueConfig);

    expect(amqp.connect).toHaveBeenCalledWith(queueConfig.url);
    expect(mockChannel.assertQueue).toHaveBeenCalledWith(queueConfig.queueName, {
      durable: true
    });
    expect(mockChannel.assertExchange).toHaveBeenCalledWith(
      queueConfig.exchangeName,
      'topic',
      { durable: true }
    );
    expect(mockChannel.bindQueue).toHaveBeenCalledWith(
      queueConfig.queueName,
      queueConfig.exchangeName,
      '#'
    );
  });

  it('should process incoming task notifications', async () => {
    await notificationService.setupMessageQueue(queueConfig);

    expect(messageHandler).toBeDefined();
    if (!messageHandler) {
      throw new Error('Message handler was not initialized');
    }

    // Simulate incoming message
    const mockMessage = {
      content: Buffer.from(JSON.stringify({
        id: 'test-id',
        type: NotificationType.TASK_CREATED,
        timestamp: new Date(),
        guildId: mockConfig.guildId,
        taskId: 'task-123',
        taskTitle: 'Test Task',
        action: 'created',
        channelId: 'test-channel'
      })),
      properties: {},
      fields: {}
    };

    await messageHandler(mockMessage);

    expect(client.channels.fetch).toHaveBeenCalledWith('test-channel');
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Processing task notification'),
      expect.any(Object)
    );
  });

  it('should handle invalid message format', async () => {
    await notificationService.setupMessageQueue(queueConfig);

    expect(messageHandler).toBeDefined();
    if (!messageHandler) {
      throw new Error('Message handler was not initialized');
    }

    const mockMessage = {
      content: Buffer.from('invalid json'),
      properties: {},
      fields: {}
    };

    await messageHandler(mockMessage);

    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process message'),
      expect.any(Error)
    );
  });

  it('should publish task notifications', async () => {
    await notificationService.setupMessageQueue(queueConfig);

    const notification = {
      id: 'test-id',
      type: NotificationType.TASK_CREATED,
      timestamp: new Date(),
      guildId: mockConfig.guildId,
      taskId: 'task-123',
      taskTitle: 'Test Task',
      action: 'created'
    };

    await notificationService.send(NotificationType.TASK_CREATED, notification);

    expect(mockChannel.publish).toHaveBeenCalledWith(
      'notifications',
      'task.created',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        messageId: notification.id,
        type: NotificationType.TASK_CREATED
      })
    );
  });

  it('should handle connection errors', async () => {
    const error = new Error('Connection failed');
    (amqp.connect as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      notificationService.setupMessageQueue(queueConfig)
    ).rejects.toThrow('Connection failed');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to setup RabbitMQ'),
      error
    );
  });

  it('should cleanup resources on close', async () => {
    await notificationService.setupMessageQueue(queueConfig);
    await notificationService.cleanup();

    expect(mockChannel.close).toHaveBeenCalled();
    expect(mockConnection.close).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('cleanup completed')
    );
  });
});