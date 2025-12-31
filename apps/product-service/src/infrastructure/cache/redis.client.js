import Redis from 'ioredis';
import { logger } from '../../shared/utils/logger.util.js';

let redisClient = null;

export function getRedisClient() {
  if (!redisClient) {
    const redisEnabled = process.env.REDIS_ENABLED !== 'false';
    
    if (!redisEnabled) {
      logger.info('Redis caching is disabled');
      return null;
    }

    const config = {
      host: process.env.REDIS_ENDPOINT || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_AUTH_TOKEN || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    };

    redisClient = new Redis(config);

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('close', () => {
      logger.info('Redis client connection closed');
    });
  }

  return redisClient;
}

export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

