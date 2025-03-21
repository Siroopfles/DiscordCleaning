export * from './permissions';
/**
 * Collection of utility functions for Discord bot operations
 */

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}