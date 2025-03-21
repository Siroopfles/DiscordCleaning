import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Redis from 'ioredis';
import logger from '../utils/logger';
import {
  calendarApiDuration,
  calendarSyncDuration,
  cacheHits,
  cacheMisses,
  rateLimitRemaining,
  errorCounter
} from '../config/metrics';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

export class CalendarService {
  private redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(private oauth2Client: OAuth2Client) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      enableOfflineQueue: false
    });

    // Monitor Redis connection
    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
      errorCounter.labels('redis').inc();
    });
  }

  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        cacheHits.labels('calendar_events').inc();
        return JSON.parse(cached);
      }
      cacheMisses.labels('calendar_events').inc();
      return null;
    } catch (error) {
      logger.error('Cache error:', error);
      errorCounter.labels('cache').inc();
      return null;
    }
  }

  private async setToCache(key: string, value: any): Promise<void> {
    try {
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
      errorCounter.labels('cache').inc();
    }
  }

  async listEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    const endTimer = calendarApiDuration.labels('list_events').startTimer();
    const cacheKey = `calendar:events:${timeMin.toISOString()}:${timeMax.toISOString()}`;

    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      // Update rate limit metrics
      const quotaRemaining = parseInt(response.headers['x-ratelimit-remaining'] as string || '0');
      rateLimitRemaining.set(quotaRemaining);

      const events = response.data.items as CalendarEvent[];
      
      // Cache the results
      await this.setToCache(cacheKey, events);

      return events;
    } catch (error: any) {
      logger.error('Calendar API error:', error);
      errorCounter.labels('api').inc();
      throw error;
    } finally {
      endTimer();
    }
  }

  async syncEvents(events: CalendarEvent[]): Promise<void> {
    const endTimer = calendarSyncDuration.labels('sync').startTimer();
    
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Batch operations for efficiency
      // Process events in parallel with a concurrency limit
      const CONCURRENT_REQUESTS = 3;
      const chunks = Array.from({ length: Math.ceil(events.length / CONCURRENT_REQUESTS) },
        (_, i) => events.slice(i * CONCURRENT_REQUESTS, (i + 1) * CONCURRENT_REQUESTS)
      );
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(event =>
          calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
          })
        ));
      }
    } catch (error: any) {
      logger.error('Calendar sync error:', error);
      errorCounter.labels('sync').inc();
      throw error;
    } finally {
      endTimer();
    }
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}