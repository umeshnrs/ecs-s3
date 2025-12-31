import { logger } from '../shared/utils/logger.util.js';

/**
 * Rate limiting configuration for public endpoints
 */
export const rateLimitConfig = {
  // Public endpoints
  public: {
    max: 200, // 200 requests
    timeWindow: '1 minute', // per minute
    cache: 10000,
    allowList: [],
    continueExceeding: false,
  },
};

/**
 * Register rate limiting plugin with Fastify
 * @param {FastifyInstance} fastify - Fastify instance
 */
export async function registerRateLimiter(fastify) {
  try {
    await fastify.register(import('@fastify/rate-limit'), {
      global: false, // Don't apply globally, apply per route
      max: rateLimitConfig.public.max,
      timeWindow: rateLimitConfig.public.timeWindow,
      cache: rateLimitConfig.public.cache,
      allowList: rateLimitConfig.public.allowList,
      continueExceeding: rateLimitConfig.public.continueExceeding,
      errorResponseBuilder: (request, context) => {
        logger.warn(`Rate limit exceeded for ${request.ip} on ${request.url}`);
        return {
          success: false,
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            statusCode: 429,
            requestId: request.id,
            retryAfter: Math.ceil(context.ttl / 1000), // seconds
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
          },
        };
      },
    });
    
    logger.info('Rate limiting plugin registered');
  } catch (error) {
    logger.error('Failed to register rate limiter:', error);
    throw error;
  }
}

/**
 * Create rate limit configuration for specific route
 * @param {Object} _ - Rate limit configuration (unused - handled by @fastify/rate-limit)
 * @returns {Function} Fastify route hook
 */
export function createRateLimit(_) {
  return async (request, reply) => {
    // Apply custom rate limit configuration
    // This is handled by @fastify/rate-limit when registered per route
    return;
  };
}

