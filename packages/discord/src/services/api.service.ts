import { DiscordClient } from '../types';
import { ApiService } from '../types/api';
import { createDiscordApiService } from './integration/services/api';

// Export de nieuwe implementatie
export { DiscordApiService as DefaultApiService } from './integration/services/api';

// Factory function voor backward compatibility
export function createApiService(client: DiscordClient): ApiService {
  return createDiscordApiService(client);
}