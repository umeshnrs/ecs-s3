import { getRedisClient } from '../../infrastructure/cache/redis.client.js';
import { logger } from '../utils/logger.util.js';
import { config } from '../../config/environment.config.js';

export class CacheService {
  constructor() {
    this.client = getRedisClient();
    this.enabled = config.redis.enabled && this.client !== null;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.enabled) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null; // Graceful degradation
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttlSeconds = null) {
    if (!this.enabled) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false; // Graceful degradation
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key) {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false; // Graceful degradation
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern) {
    if (!this.enabled) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false; // Graceful degradation
    }
  }

  /**
   * Generate cache key for product
   */
  productKey(id) {
    return `product:${id}`;
  }

  /**
   * Generate cache key for product list
   */
  productListKey(category, limit, lastKey, includeInactive = false) {
    const keyParts = ['products:list'];
    if (category) {
      keyParts.push(`category:${category}`);
    } else {
      keyParts.push('all');
    }
    keyParts.push(`limit:${limit}`);
    keyParts.push(`status:${includeInactive ? 'all' : 'active'}`);
    if (lastKey) {
      keyParts.push(`lastKey:${JSON.stringify(lastKey)}`);
    }
    return keyParts.join(':');
  }

  /**
   * Invalidate all product list caches
   */
  async invalidateProductLists() {
    return await this.deletePattern('products:list:*');
  }
}

export const cacheService = new CacheService();

