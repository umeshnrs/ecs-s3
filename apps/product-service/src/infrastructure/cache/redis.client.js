import Redis from 'ioredis';
import { logger } from '../../shared/utils/logger.util.js';

let redisClient = null;

/**
 * Converts string environment variable to boolean
 * @param {string} value - Environment variable value
 * @returns {boolean} - Boolean value
 */
function parseBoolean(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() === 'true';
}

/**
 * Validates required Redis environment variables when Redis is enabled
 * @throws {Error} If required environment variables are missing
 */
function validateRedisConfig() {
  const requiredVars = {
    REDIS_ENDPOINT: process.env.REDIS_ENDPOINT,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_AUTH_TOKEN: process.env.REDIS_AUTH_TOKEN,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => value === undefined || value === '')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Redis environment variables: ${missingVars.join(', ')}`
    );
  }
}

export function getRedisClient() {
  if (!redisClient) {
    // Check if REDIS_ENABLED is set
    if (process.env.REDIS_ENABLED === undefined || process.env.REDIS_ENABLED === '') {
      throw new Error('Missing required environment variable: REDIS_ENABLED');
    }

    const redisEnabled = parseBoolean(process.env.REDIS_ENABLED);
    
    if (!redisEnabled) {
      logger.info('Redis caching is disabled');
      return null;
    }

    // Validate required Redis configuration only when Redis is enabled
    validateRedisConfig();

    const config = {
      host: process.env.REDIS_ENDPOINT,
      port: parseInt(process.env.REDIS_PORT, 10),
      password: process.env.REDIS_AUTH_TOKEN,
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

