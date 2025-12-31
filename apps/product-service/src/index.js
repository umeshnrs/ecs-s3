import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import productRoutes from './features/products/routes/product.routes.js';
import { errorHandler } from './shared/middleware/error-handler.middleware.js';
import { onRequestLogger, onResponseLogger } from './shared/middleware/request-logger.middleware.js';
import { logger } from './shared/utils/logger.util.js';
import { runMigrations } from './database/migrations/runner.js';
import { registerRateLimiter } from './middleware/rate-limiter.middleware.js';

dotenv.config();

// Configure Fastify with Pino logger
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }),
  },
  requestIdLogLabel: 'requestId',
  genReqId: () => crypto.randomUUID(),
  disableRequestLogging: false,
});

// Register CORS
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});



// Register rate limiting
await registerRateLimiter(app);

// Register middleware
app.addHook('onRequest', onRequestLogger);
app.addHook('onResponse', onResponseLogger);

// Health check endpoints
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.get('/health/ready', async (request, reply) => {
  // Check DynamoDB and Redis connectivity
    const { checkReadiness } = await import('./infrastructure/database/client.js');
  const isReady = await checkReadiness();
  
  if (isReady) {
    return { status: 'ready', timestamp: new Date().toISOString() };
  } else {
    reply.code(503);
    return { status: 'not ready', timestamp: new Date().toISOString() };
  }
});


// Register routes
await app.register(productRoutes, { prefix: '/api/v1/products' });

// Error handler
app.setErrorHandler(errorHandler);

// Run migrations automatically if AUTO_MIGRATE is enabled
const autoMigrate = process.env.AUTO_MIGRATE === 'true' || process.env.AUTO_MIGRATE === '1';
const autoSeed = process.env.AUTO_SEED === 'true' || process.env.AUTO_SEED === '1';
let migrationsRan = false;

if (autoMigrate) {
  try {
    // Wait for DynamoDB to be ready before running migrations
    const { waitForDynamoDB } = await import('./infrastructure/database/client.js');
    await waitForDynamoDB();
    
    logger.info('Auto-migration enabled. Running pending migrations...');
    const migrationResult = await runMigrations('up');
    migrationsRan = migrationResult.ran;
    
    if (migrationsRan) {
      logger.info(`Migrations completed successfully (${migrationResult.count} migration(s) applied)`);
    } else {
      logger.info('Migrations completed - no new migrations to apply');
    }
  } catch (error) {
    logger.error('Migration failed:');
    logger.error('Error message:', error.message);
    logger.error('Error name:', error.name);
    logger.error('Error code:', error.code);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    if (error.cause) {
      logger.error('Error cause:', error.cause);
    }
    // Log additional error details if available
    if (error.$metadata) {
      logger.error('AWS SDK metadata:', error.$metadata);
    }
    logger.error('Server will not start due to migration failure');
    process.exit(1);
  }
} else {
  logger.info('Auto-migration disabled. Set AUTO_MIGRATE=true to enable automatic migrations');
}

// Run seed automatically if AUTO_SEED is enabled
// Seed will check internally if it has already been applied (idempotent)
if (autoSeed) {
  try {
    // Wait for DynamoDB to be ready before running seed
    const { waitForDynamoDB } = await import('./infrastructure/database/client.js');
    await waitForDynamoDB();
    
    logger.info('Auto-seed enabled. Running seed data...');
    const { runSeed } = await import('./database/seeds/runner.js');
    const seedRan = await runSeed(false);
    
    if (seedRan) {
      logger.info('Seed data applied successfully');
    } else {
      logger.info('Seed data already applied, skipping...');
    }
  } catch (error) {
    logger.error('Seed failed:');
    logger.error('Error message:', error.message);
    logger.error('Error name:', error.name);
    logger.error('Error code:', error.code);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    if (error.cause) {
      logger.error('Error cause:', error.cause);
    }
    // Log additional error details if available
    if (error.$metadata) {
      logger.error('AWS SDK metadata:', error.$metadata);
    }
    // Don't exit on seed failure - allow server to start
    logger.warn('Server will start despite seed failure. Seed can be run manually later.');
  }
} else {
  logger.info('Auto-seed disabled. Set AUTO_SEED=true to enable automatic seeding');
}

// Initialize monitoring
const { initializeMonitoring } = await import('./shared/services/monitoring.service.js');
await initializeMonitoring();

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  logger.info(`Server listening on ${HOST}:${PORT}`);
} catch (err) {
  logger.error(err);
  process.exit(1);
}

