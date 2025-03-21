export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
}

export interface CreateCalendarEventDTO {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export interface UpdateCalendarEventDTO extends Partial<CreateCalendarEventDTO> {
  id: string;
}

export interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  eventId?: string;
  data?: CreateCalendarEventDTO | UpdateCalendarEventDTO;
  timestamp: string;
  retryCount?: number;
}

export interface CalendarSyncMessage {
  userId: string;
  operation: SyncOperation;
  correlationId: string;
}

export interface SyncResult {
  success: boolean;
  event?: CalendarEvent;
  error?: string;
  retryable?: boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface CalendarServiceConfig {
  rateLimit: RateLimitConfig;
  maxRetries: number;
  retryDelayMs: number;
}

// Redis cache keys
export const CACHE_KEYS = {
  CALENDAR_EVENTS: (userId: string) => `calendar:events:${userId}`,
  RATE_LIMIT: (userId: string) => `ratelimit:calendar:${userId}`,
  SYNC_STATE: (userId: string) => `calendar:sync:state:${userId}`
};