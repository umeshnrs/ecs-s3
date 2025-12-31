import { logger } from '../utils/logger.util.js';
import { errorResponse } from '../utils/response.util.js';
import { AppError, getUserFriendlyMessage } from '../utils/errors.js';

export async function errorHandler(error, request, reply) {
  // Log error with context
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    requestId: request.id,
    url: request.url,
    method: request.method,
    statusCode: error.statusCode || 500,
    code: error.code,
    details: error.details,
  });

  // Handle custom AppError instances
  if (error instanceof AppError) {
    const response = errorResponse(
      getUserFriendlyMessage(error),
      error.statusCode,
      request.id,
      {
        code: error.code,
        ...error.details,
      }
    );
    return reply.code(error.statusCode).send(response);
  }

  // Handle validation errors
  if (error.message && error.message.includes('Validation failed:')) {
    const response = errorResponse(
      getUserFriendlyMessage(error),
      400,
      request.id,
      {
        code: 'VALIDATION_ERROR',
        validation: error.message,
      }
    );
    return reply.code(400).send(response);
  }

  // Handle "not found" errors
  if (error.message && error.message.includes('not found')) {
    const response = errorResponse(
      getUserFriendlyMessage(error),
      404,
      request.id,
      {
        code: 'NOT_FOUND',
      }
    );
    return reply.code(404).send(response);
  }

  // Handle Fastify validation errors
  if (error.validation) {
    const response = errorResponse(
      'Validation failed',
      400,
      request.id,
      {
        code: 'VALIDATION_ERROR',
        validation: error.validation,
      }
    );
    return reply.code(400).send(response);
  }

  // Handle JWT errors
  if (error.message && (error.message.includes('token') || error.message.includes('JWT'))) {
    const response = errorResponse(
      'Invalid or expired authentication token',
      401,
      request.id,
      {
        code: 'UNAUTHORIZED',
      }
    );
    return reply.code(401).send(response);
  }

  // Default error handling
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal Server Error' 
    : getUserFriendlyMessage(error);
  
  const response = errorResponse(
    message,
    statusCode,
    request.id,
    {
      code: 'INTERNAL_ERROR',
      // Only include error details in development
      ...(process.env.NODE_ENV === 'development' && {
        originalError: error.message,
      }),
    }
  );
  
  reply.code(statusCode).send(response);
}

