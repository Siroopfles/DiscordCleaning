import { REST, Routes, Collection, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../../src/commands/handler';
import { Command } from '../../src/commands/types';
import { DiscordClient, DiscordConfig, Logger } from '../../src/types';

// Mock implementations
const MockREST = REST as unknown as jest.Mock;
const MockRoutes = Routes as unknown as {
  applicationCommands: jest.Mock;
  applicationGuildCommands: jest.Mock;
};

jest.mock('discord.js', () => ({
  REST: jest.fn(),
  Routes: {
    applicationCommands: jest.fn(),
    applicationGuildCommands: jest.fn()
  },
  Collection: jest.fn(() => ({
    set: jest.fn(),
    map: jest.fn(),
    get: jest.fn()
  })),
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({})
  }))
}));

describe('Command Handler E2E Tests', () => {
  let client: Partial<DiscordClient>;
  let commandHandler: CommandHandler;
  let mockRest: jest.Mocked<REST>;
  let mockCommand: Command;
  let interactionHandler: ((interaction: ChatInputCommandInteraction) => Promise<void>) | undefined;

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
    interactionHandler = undefined;

    // Setup mock REST
    mockRest = {
      setToken: jest.fn().mockReturnThis(),
      put: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<REST>;
    MockREST.mockImplementation(() => mockRest);

    // Setup mock Routes
    MockRoutes.applicationCommands.mockReturnValue('global-commands-path');
    MockRoutes.applicationGuildCommands.mockReturnValue('guild-commands-path');

    // Setup mock command
    const mockExecute = jest.fn().mockResolvedValue(undefined);
    mockCommand = {
      data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test command'),
      execute: mockExecute
    };

    // Setup mock client
    client = {
      config: mockConfig,
      services: { logger: mockLogger },
      on: jest.fn((event: string, handler: any) => {
        if (event === 'interactionCreate') {
          interactionHandler = handler;
        }
      }),
      once: jest.fn()
    };

    // Initialize command handler
    commandHandler = new CommandHandler({
      commands: [mockCommand],
      client: client as DiscordClient
    });
  });

  it('should register commands for specific guild', async () => {
    await commandHandler.registerCommands();

    expect(mockRest.put).toHaveBeenCalledWith(
      'guild-commands-path',
      expect.any(Object)
    );
    expect(MockRoutes.applicationGuildCommands).toHaveBeenCalledWith(
      mockConfig.clientId,
      mockConfig.guildId
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Successfully registered')
    );
  });

  it('should register global commands when no guildId is provided', async () => {
    const globalConfig = { ...mockConfig, guildId: undefined };
    const globalClient = {
      ...client,
      config: globalConfig
    };

    commandHandler = new CommandHandler({
      commands: [mockCommand],
      client: globalClient as DiscordClient
    });

    await commandHandler.registerCommands();

    expect(mockRest.put).toHaveBeenCalledWith(
      'global-commands-path',
      expect.any(Object)
    );
    expect(MockRoutes.applicationCommands).toHaveBeenCalledWith(
      mockConfig.clientId
    );
  });

  it('should handle command registration errors', async () => {
    const error = new Error('Registration failed');
    mockRest.put.mockRejectedValueOnce(error);

    await expect(commandHandler.registerCommands()).rejects.toThrow('Registration failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error registering application commands:',
      error
    );
  });

  it('should handle command interaction', async () => {
    // Setup mock interaction
    const interaction = {
      commandName: 'test',
      isChatInputCommand: () => true,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
      deferred: false,
      replied: false
    } as unknown as ChatInputCommandInteraction;

    // Ensure interaction handler is defined
    expect(interactionHandler).toBeDefined();
    if (!interactionHandler) return;

    // Simulate interaction
    await interactionHandler(interaction);

    expect(mockCommand.execute).toHaveBeenCalledWith(interaction, client);
  });

  it('should handle command execution errors', async () => {
    const error = new Error('Execution failed');
    jest.spyOn(mockCommand, 'execute').mockRejectedValueOnce(error);

    const interaction = {
      commandName: 'test',
      isChatInputCommand: () => true,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
      deferred: false,
      replied: false
    } as unknown as ChatInputCommandInteraction;

    // Ensure interaction handler is defined
    expect(interactionHandler).toBeDefined();
    if (!interactionHandler) return;

    await interactionHandler(interaction);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error executing command test:',
      error
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('Er is een fout opgetreden'),
      ephemeral: true
    });
  });

  it('should handle deferred interactions on error', async () => {
    const error = new Error('Execution failed');
    jest.spyOn(mockCommand, 'execute').mockRejectedValueOnce(error);

    const interaction = {
      commandName: 'test',
      isChatInputCommand: () => true,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
      deferred: true,
      replied: true
    } as unknown as ChatInputCommandInteraction;

    // Ensure interaction handler is defined
    expect(interactionHandler).toBeDefined();
    if (!interactionHandler) return;

    await interactionHandler(interaction);

    expect(interaction.followUp).toHaveBeenCalledWith({
      content: expect.stringContaining('Er is een fout opgetreden'),
      ephemeral: true
    });
  });
});