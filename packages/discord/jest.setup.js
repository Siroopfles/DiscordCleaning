// Add any global test setup here
process.env.NODE_ENV = 'test';

// Mock Discord.js WebSocket connection
jest.mock('discord.js', () => {
  const original = jest.requireActual('discord.js');
  return {
    ...original,
    WebSocketManager: jest.fn().mockImplementation(() => ({
      ping: 42
    }))
  };
});