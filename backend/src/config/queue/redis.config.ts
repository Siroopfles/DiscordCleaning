import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

const defaultConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10)
};

export function createRedisClient(config: RedisConfig = defaultConfig): Redis {
  const client = new Redis(config);

  client.on('error', (error: Error) => {
    console.error('Redis Client Error:', error);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  return client;
}

// Rate limiting helpers
export async function checkRateLimit(
  redis: Redis,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.pexpire(key, windowMs);
  }

  return current <= maxRequests;
}

// Cache helpers
export async function getCachedData<T>(
  redis: Redis,
  key: string
): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCachedData(
  redis: Redis,
  key: string,
  data: unknown,
  expirationMs?: number
): Promise<void> {
  const serialized = JSON.stringify(data);
  if (expirationMs) {
    await redis.psetex(key, expirationMs, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function invalidateCache(
  redis: Redis,
  key: string
): Promise<void> {
  await redis.del(key);
}