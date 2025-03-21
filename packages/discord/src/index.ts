// Export all types
export * from './types';

// Export client functionality
export * from './client';

// Export commands and command handler
export * from './commands';

// Export services
export * from './services';

// Export utility functions
export * from './utils';

// Default export for convenient initialization
import { createDiscordClient, connectDiscordClient } from './client';
import { createCommandHandler } from './commands';
import { commands } from './commands';

export default {
  createClient: createDiscordClient,
  connectClient: connectDiscordClient,
  createCommandHandler,
  commands
};