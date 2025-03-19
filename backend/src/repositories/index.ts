import { userRepository } from './user.repository';
import { taskRepository } from './task.repository';
import { categoryRepository } from './category.repository';
import { serverRepository } from './server.repository';

export * from './base.repository';
export * from './user.repository';
export * from './task.repository';
export * from './category.repository';
export * from './server.repository';

// Export singleton instances
export const repositories = {
  userRepository,
  taskRepository,
  categoryRepository,
  serverRepository,
} as const;

// Export repository instance type
export type Repositories = typeof repositories;

// Factory function to create new repository instances if needed
export function createRepositories() {
  return { ...repositories };
}