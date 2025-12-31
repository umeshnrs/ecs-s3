/**
 * Monitoring Service
 * Centralized monitoring and error tracking
 */

import { logger } from '../utils/logger.util.js';

/**
 * Initialize monitoring (Sentry, etc.)
 */
export async function initializeMonitoring() {
  // Sentry initialization would go here
  // For now, we'll use structured logging
  
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import to avoid requiring Sentry in development
      const Sentry = await import('@sentry/node');
      
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
        ],
      });
      
      logger.info('Sentry monitoring initialized');
    } catch (error) {
      logger.warn('Failed to initialize Sentry:', error);
    }
  } else {
    logger.info('Sentry DSN not configured, using structured logging only');
  }
}

/**
 * Capture exception for monitoring
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import
      import('@sentry/node').then((Sentry) => {
        Sentry.captureException(error, {
          extra: context,
        });
      }).catch(() => {
        // Fallback to logging if Sentry fails
        logger.error('Error captured:', { error, context });
      });
    } catch {
      logger.error('Error captured:', { error, context });
    }
  } else {
    logger.error('Error captured:', { error, context });
  }
}

/**
 * Capture message for monitoring
 * @param {string} message - Message to capture
 * @param {string} level - Log level (info, warning, error)
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (process.env.SENTRY_DSN) {
    try {
      import('@sentry/node').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: Sentry.Severity[level.toUpperCase()] || Sentry.Severity.INFO,
          extra: context,
        });
      }).catch(() => {
        logger[level]('Message captured:', { message, context });
      });
    } catch {
      logger[level]('Message captured:', { message, context });
    }
  } else {
    logger[level]('Message captured:', { message, context });
  }
}

/**
 * Add breadcrumb for tracing
 * @param {string} message - Breadcrumb message
 * @param {string} category - Breadcrumb category
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, category = 'default', data = {}) {
  if (process.env.SENTRY_DSN) {
    try {
      import('@sentry/node').then((Sentry) => {
        Sentry.addBreadcrumb({
          message,
          category,
          data,
          level: Sentry.Severity.INFO,
        });
      });
    } catch {
      // Silently fail if Sentry not available
    }
  }
}

