import { createClient } from 'redis';
import logger from '../utils/logger';

interface RateLimiterOptions {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Maximum number of requests within the time window
  keyPrefix?: string;  // Prefix for Redis keys
}

class RateLimiter {
  private client: ReturnType<typeof createClient>;
  private options: Required<RateLimiterOptions>;

  constructor(options: RateLimiterOptions) {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.options = {
      keyPrefix: 'ratelimit:',
      ...options
    };

    this.setupClient();
  }

  private async setupClient(): Promise<void> {
    try {
      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
      });

      await this.client.connect();
      logger.info('Redis client connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async isRateLimited(key: string): Promise<boolean> {
    const redisKey = `${this.options.keyPrefix}${key}`;
    
    try {
      const pipeline = this.client.multi();
      
      // Get current count
      const count = await this.client.incr(redisKey);
      
      // Set expiration if this is the first request
      if (count === 1) {
        await this.client.pExpire(redisKey, this.options.windowMs);
      }
      
      return count > this.options.max;
    } catch (error) {
      logger.error(`Rate limiting error for key ${key}:`, error);
      return false; // Fail open on Redis errors
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client closed successfully');
    } catch (error) {
      logger.error('Error closing Redis client:', error);
      throw error;
    }
  }
}

// Create rate limiter instances with different configurations
export const webhookRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,             // 60 requests per minute
  keyPrefix: 'webhook:'
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                  // 100 requests per 15 minutes
  keyPrefix: 'api:'
});

export default RateLimiter;