import { dynamoClient, dynamoDBClient, TABLE_NAME } from '../../infrastructure/database/client.js';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../../shared/utils/logger.util.js';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_TABLE = 'migrations';

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable() {
  try {
    await dynamoDBClient.send(new DescribeTableCommand({ TableName: MIGRATIONS_TABLE }));
    logger.info('Migrations table exists');
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      logger.info('Creating migrations table...');
      await dynamoDBClient.send(new CreateTableCommand({
        TableName: MIGRATIONS_TABLE,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      logger.info('Migrations table created');
    } else {
      throw error;
    }
  }
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations() {
  try {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const result = await dynamoClient.send(new ScanCommand({
      TableName: MIGRATIONS_TABLE,
    }));
    return new Set(result.Items.map(item => item.id));
  } catch (error) {
    logger.error('Error getting applied migrations:', error);
    return new Set();
  }
}

/**
 * Mark migration as applied
 */
async function markMigrationApplied(id, direction) {
  try {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    await dynamoClient.send(new PutCommand({
      TableName: MIGRATIONS_TABLE,
      Item: {
        id,
        direction,
        appliedAt: new Date().toISOString(),
      },
    }));
  } catch (error) {
    logger.error('Error marking migration as applied:', error);
    throw error;
  }
}

/**
 * Load migration files
 */
async function loadMigrations() {
  const migrationsDir = join(__dirname, 'files');
  const files = await readdir(migrationsDir);
  const migrationFiles = files
    .filter(file => file.endsWith('.js'))
    .sort();

  const migrations = [];
  for (const file of migrationFiles) {
    const migrationPath = join(migrationsDir, file);
    const migration = await import(`file://${migrationPath}`);
    migrations.push({
      id: file.replace('.js', ''),
      file,
      ...migration.default,
    });
  }

  return migrations;
}

/**
 * Run migrations
 * @returns {Promise<{ran: boolean, count: number}>} - Returns whether migrations ran and count
 */
export async function runMigrations(direction = 'up') {
  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();
  const migrations = await loadMigrations();

  logger.info(`Running migrations (${direction})...`);

  const migrationsToRun = direction === 'up'
    ? migrations.filter(m => !appliedMigrations.has(m.id))
    : migrations.filter(m => appliedMigrations.has(m.id)).reverse();

  if (migrationsToRun.length === 0) {
    logger.info('No migrations to run');
    return { ran: false, count: 0 };
  }

  // Map migration IDs to their respective table names
  const tableMap = {
    '20240101120000_create_products_table': TABLE_NAME,
  };

  for (const migration of migrationsToRun) {
    try {
      logger.info(`Running migration: ${migration.id} (${direction})`);
      const tableName = tableMap[migration.id] || TABLE_NAME;
      
      if (direction === 'up' && migration.up) {
        await migration.up(dynamoDBClient, tableName);
      } else if (direction === 'down' && migration.down) {
        await migration.down(dynamoDBClient, tableName);
      }

      await markMigrationApplied(migration.id, direction);
      logger.info(`Migration ${migration.id} completed`);
    } catch (error) {
      logger.error(`Migration ${migration.id} failed:`);
      logger.error('Error message:', error.message);
      logger.error('Error name:', error.name);
      logger.error('Error code:', error.code);
      if (error.stack) {
        logger.error('Stack trace:', error.stack);
      }
      throw error;
    }
  }

  logger.info(`All migrations completed (${direction})`);
  return { ran: true, count: migrationsToRun.length };
}

