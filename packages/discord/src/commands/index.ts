export * from './types';
export * from './handler';

// Export all command groups
export * as taskCommands from './task';
export * as categoryCommands from './category';
// TODO: Uncomment when migrated
// export * as currencyCommands from './currency';

// Default export array of all available commands
import { task } from './task';
import category from './category';

export const commands = [
  task,
  category,
  // TODO: Add other command groups when migrated
  // currency
];

export default commands;