/**
 * Custom Error Classes
 * Industry standard error handling with proper error codes and context
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Validation Error
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not Found Error
 * Used when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, id });
  }
}

/**
 * Unauthorized Error
 * Used for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error
 * Used for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error
 * Used when a resource conflict occurs (e.g., duplicate SKU)
 */
export class ConflictError extends AppError {
  constructor(message, details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Bad Request Error
 * Used for malformed requests
 */
export class BadRequestError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details = {}) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Service Unavailable Error
 * Used when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details = {}) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Convert error to user-friendly message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
  if (error instanceof AppError) {
    return error.message;
  }
  
  // Map common error types to user-friendly messages
  if (error.message && error.message.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  if (error.message && error.message.includes('already exists')) {
    return 'This resource already exists. Please use a different value.';
  }
  
  if (error.message && error.message.includes('Validation failed')) {
    return 'Please check your input and try again.';
  }
  
  // Default message for unknown errors
  return 'An unexpected error occurred. Please try again later.';
}

