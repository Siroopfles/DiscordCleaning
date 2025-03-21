import { Client, GatewayIntentBits } from 'discord.js';
import { createDiscordClient, connectDiscordClient } from '../../src/client';
import { DiscordClient, DiscordConfig, Logger } from '../../src/types';

// Correct type casting voor Jest mocks
const MockClient = Client as unknown as jest.Mock;
jest.mock('discord.js', () => ({
  Client: jest.fn(),
  GatewayIntentBits: {
    Guilds: 'GUILDS',
    GuildMessages: 'GUILD_MESSAGES',
    MessageContent: 'MESSAGE_CONTENT',
    GuildMembers: 'GUILD_MEMBERS'
  }
}));

describe('Discord Client E2E Tests', () => {
  let client: DiscordClient;
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
    MockClient.mockClear();
    MockClient.mockImplementation(() => ({
      once: jest.fn(),
      on: jest.fn(),
      login: jest.fn().mockResolvedValue(undefined),
      user: { tag: 'TestBot#0000' }
    }));
  });

  it('should initialize discord client with correct configuration', async () => {
    client = createDiscordClient({
      config: mockConfig,
      services: { logger: mockLogger }
    });

    expect(MockClient).toHaveBeenCalledWith({
      intents: expect.arrayContaining([
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ])
    });
    
    expect(client.config).toEqual(mockConfig);
    expect(client.services.logger).toBe(mockLogger);
  });

  it('should connect client successfully', async () => {
    client = createDiscordClient({
      config: mockConfig,
      services: { logger: mockLogger }
    });

    await connectDiscordClient(client);

    expect(client.login).toHaveBeenCalledWith(mockConfig.token);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('TestBot#0000')
    );
  });

  it('should handle connection errors gracefully', async () => {
    const mockError = new Error('Connection failed');
    MockClient.mockImplementationOnce(() => ({
      once: jest.fn(),
      on: jest.fn(),
      login: jest.fn().mockRejectedValue(mockError),
      user: { tag: 'TestBot#0000' }
    }));

    client = createDiscordClient({
      config: mockConfig,
      services: { logger: mockLogger }
    });

    await expect(connectDiscordClient(client)).rejects.toThrow('Connection failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to connect Discord client:',
      mockError
    );
  });

  it('should handle discord client errors', async () => {
    let errorHandler: (error: Error) => void = () => {};
    
    MockClient.mockImplementationOnce(() => ({
      once: jest.fn(),
      on: jest.fn((event: string, handler: any) => {
        if (event === 'error') errorHandler = handler;
      }),
      login: jest.fn().mockResolvedValue(undefined),
      user: { tag: 'TestBot#0000' }
    }));

    client = createDiscordClient({
      config: mockConfig,
      services: { logger: mockLogger }
    });

    const testError = new Error('Discord error');
    errorHandler(testError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Discord client error:',
      testError
    );
  });
});