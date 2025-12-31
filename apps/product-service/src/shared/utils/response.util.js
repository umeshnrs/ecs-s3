/**
 * Standardized API Response Utility
 * 
 * Industry best practices for API responses:
 * - Consistent structure across all endpoints
 * - Standardized error format
 * - Metadata for pagination, timestamps, versioning
 * - Request correlation IDs
 */

/**
 * Standard success response wrapper
 * @param {Object} data - Response data
 * @param {Object} meta - Optional metadata (pagination, timestamps, etc.)
 * @param {string} requestId - Request correlation ID
 * @returns {Object} Standardized response
 */
export function successResponse(data, meta = {}, requestId = null) {
  const response = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      ...meta,
    },
  };

  return response;
}

/**
 * Standard error response wrapper
 * @param {string|Error} error - Error message or Error object
 * @param {number} statusCode - HTTP status code
 * @param {string} requestId - Request correlation ID
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error response
 */
export function errorResponse(error, statusCode = 500, requestId = null, details = {}) {
  const message = error instanceof Error ? error.message : error;
  
  return {
    success: false,
    error: {
      message,
      statusCode,
      requestId,
      ...details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Standard pagination metadata
 * @param {number} limit - Items per page
 * @param {number} count - Current page item count
 * @param {string|Object} lastKey - Last key for pagination
 * @param {number} total - Total items (if available)
 * @returns {Object} Pagination metadata
 */
export function paginationMeta(limit, count, lastKey = null, total = null) {
  return {
    pagination: {
      limit,
      count,
      hasMore: !!lastKey,
      lastKey: lastKey || null,
      ...(total !== null && { total }),
    },
  };
}

/**
 * Single resource response (GET by ID, CREATE, UPDATE)
 * @param {string} resourceName - Name of the resource (e.g., 'product', 'category')
 * @param {Object} resource - Resource data
 * @param {string} requestId - Request correlation ID
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized single resource response
 */
export function singleResourceResponse(resourceName, resource, requestId = null) {
  return {
    success: true,
    data: {
      [resourceName]: resource,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * List resource response (GET list)
 * @param {string} resourceName - Plural name of the resource (e.g., 'products', 'categories')
 * @param {Array} items - Array of resources
 * @param {Object} pagination - Pagination metadata
 * @param {string} requestId - Request correlation ID
 * @returns {Object} Standardized list response
 */
export function listResourceResponse(resourceName, items, pagination = {}, requestId = null) {
  return {
    success: true,
    data: {
      [resourceName]: items,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      ...paginationMeta(
        pagination.limit || items.length,
        items.length,
        pagination.lastKey,
        pagination.total
      ),
    },
  };
}

/**
 * Message response (DELETE, custom operations)
 * @param {string} message - Success message
 * @param {Object} data - Optional additional data
 * @param {string} requestId - Request correlation ID
 * @returns {Object} Standardized message response
 */
export function messageResponse(message, data = {}, requestId = null) {
  return {
    success: true,
    data: {
      message,
      ...data,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

