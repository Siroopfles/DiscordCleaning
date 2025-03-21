import { BaseService } from './base.service';
import { DiscordClient } from '../types';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimit {
  attempts: number;
  resetAt: number;
}

export class RateLimiterService extends BaseService {
  private limits: Map<string, RateLimit>;
  private config: RateLimitConfig;

  constructor(client: DiscordClient, config: RateLimitConfig = { maxAttempts: 5, windowMs: 60000 }) {
    super(client);
    this.limits = new Map();
    this.config = config;
  }

  protected async initialize(): Promise<void> {
    this.log('info', 'Rate limiter service initialized', this.config);
  }

  private getKey(userId: string, serverId: string, action: string): string {
    return `${userId}:${serverId}:${action}`;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, limit] of this.limits.entries()) {
      if (limit.resetAt <= now) {
        this.limits.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.log('debug', 'Cleaned expired rate limits', { cleaned });
    }
  }

  attempt(userId: string, serverId: string, action: string): boolean {
    this.cleanupExpired();
    
    const key = this.getKey(userId, serverId, action);
    const now = Date.now();
    
    const currentLimit = this.limits.get(key);
    
    if (!currentLimit) {
      this.limits.set(key, {
        attempts: 1,
        resetAt: now + this.config.windowMs
      });
      this.log('debug', 'New rate limit created', { userId, serverId, action });
      return true;
    }

    if (currentLimit.resetAt <= now) {
      this.limits.set(key, {
        attempts: 1,
        resetAt: now + this.config.windowMs
      });
      this.log('debug', 'Rate limit reset', { userId, serverId, action });
      return true;
    }

    if (currentLimit.attempts >= this.config.maxAttempts) {
      this.log('warn', 'Rate limit exceeded', {
        userId,
        serverId,
        action,
        attempts: currentLimit.attempts,
        resetAt: currentLimit.resetAt
      });
      return false;
    }

    currentLimit.attempts++;
    this.log('debug', 'Rate limit attempt recorded', {
      userId,
      serverId,
      action,
      attempts: currentLimit.attempts,
      remaining: this.config.maxAttempts - currentLimit.attempts
    });
    return true;
  }

  getRemainingAttempts(userId: string, serverId: string, action: string): number {
    this.cleanupExpired();
    
    const key = this.getKey(userId, serverId, action);
    const limit = this.limits.get(key);
    
    if (!limit || limit.resetAt <= Date.now()) {
      return this.config.maxAttempts;
    }

    return Math.max(0, this.config.maxAttempts - limit.attempts);
  }

  getResetTime(userId: string, serverId: string, action: string): number | null {
    const key = this.getKey(userId, serverId, action);
    const limit = this.limits.get(key);
    
    if (!limit || limit.resetAt <= Date.now()) {
      return null;
    }

    return limit.resetAt;
  }
}