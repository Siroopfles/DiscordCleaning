interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimit {
  attempts: number;
  resetAt: number;
}

export class RateLimiterService {
  private limits: Map<string, RateLimit>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxAttempts: 5, windowMs: 60000 }) {
    this.limits = new Map();
    this.config = config;
  }

  private getKey(userId: string, serverId: string, action: string): string {
    return `${userId}:${serverId}:${action}`;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (limit.resetAt <= now) {
        this.limits.delete(key);
      }
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
      return true;
    }

    if (currentLimit.resetAt <= now) {
      this.limits.set(key, {
        attempts: 1,
        resetAt: now + this.config.windowMs
      });
      return true;
    }

    if (currentLimit.attempts >= this.config.maxAttempts) {
      return false;
    }

    currentLimit.attempts++;
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