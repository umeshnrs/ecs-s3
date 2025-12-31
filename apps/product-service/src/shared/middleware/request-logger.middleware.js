import { logger } from '../utils/logger.util.js';

export async function onRequestLogger(request, reply) {
  // Store start time on the request object
  request.startTime = Date.now();
  
  logger.info('incoming request', {
    requestId: request.id,
    method: request.method,
    url: request.url,
  });
}

export async function onResponseLogger(request, reply) {
  const duration = Date.now() - (request.startTime || Date.now());
  
  logger.info('request completed', {
    requestId: request.id,
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
  });
}

