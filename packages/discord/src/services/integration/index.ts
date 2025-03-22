/**
 * Integration Services Module
 * Provides factories for creating integration service instances
 */

// Re-export types first to avoid naming conflicts
export * from '../../types/api';
export * from '../../types/notification';
export * from '../../types/queue';

// Export interfaces
export * from './interfaces/api.interface';
export * from './interfaces/notification.interface';

// Export factories and service implementations explicitly
export {
  ApiServiceFactory,
  NotificationServiceFactory,
  ApiService,
  NotificationService
} from './services/index';