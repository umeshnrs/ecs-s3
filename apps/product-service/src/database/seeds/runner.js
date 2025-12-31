import { dynamoClient, dynamoDBClient, TABLE_NAME } from '../../infrastructure/database/client.js';
import { logger } from '../../shared/utils/logger.util.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { productRepository } from '../../features/products/repositories/product.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEEDS_TABLE = 'migrations';
const SEED_ID = 'seed_initial_data';

/**
 * Check if seed has been applied
 */
async function isSeedApplied() {
  try {
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const result = await dynamoClient.send(new GetCommand({
      TableName: SEEDS_TABLE,
      Key: { id: SEED_ID },
    }));
    return !!result.Item;
  } catch (error) {
    logger.error({ err: error }, 'Error checking if seed is applied');
    return false;
  }
}

/**
 * Mark seed as applied
 */
async function markSeedApplied() {
  try {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    await dynamoClient.send(new PutCommand({
      TableName: SEEDS_TABLE,
      Item: {
        id: SEED_ID,
        direction: 'up',
        appliedAt: new Date().toISOString(),
        type: 'seed',
      },
    }));
  } catch (error) {
    logger.error({ err: error }, 'Error marking seed as applied');
    throw error;
  }
}

/**
 * Load seed data from JSON file
 */
async function loadSeedData() {
  const seedDataPath = join(__dirname, 'data/seed-data.json');
  const fileContent = await readFile(seedDataPath, 'utf-8');
  return JSON.parse(fileContent);
}

/**
 * Seed products with idempotent operations
 */
async function seedProducts(products) {
  logger.info(`Seeding ${products.length} products...`);
  
  let seeded = 0;
  let skipped = 0;
  
  for (const product of products) {
    try {
      // Check if product already exists (idempotent check)
      const existing = await productRepository.findById(product.id).catch(() => null);
      
      if (existing) {
        logger.debug(`Product ${product.name} (${product.id}) already exists, skipping...`);
        skipped++;
        continue;
      }

      // Prepare product data with proper defaults
      const now = new Date().toISOString();
      const productData = {
        ...product,
        createdAt: now,
        updatedAt: now,
        isDeleted: product.isDeleted || false,
        deletedAt: product.deletedAt || undefined,
        colors: product.colors || [],
        sizes: product.sizes || [],
        tags: product.tags || [],
        status: product.status || 'active',
        category: product.category || '',
        brand: product.brand || '',
        sku: product.sku || '',
        images: product.images || [],
      };

      await productRepository.create(productData);
      
      seeded++;
      logger.debug(`✓ Seeded product: ${product.name}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to seed product ${product.name}`);
      throw error;
    }
  }
  
  logger.info(`Products seeding completed: ${seeded} seeded, ${skipped} skipped`);
  return { seeded, skipped };
}

/**
 * Verify required tables exist before seeding
 */
async function verifyTablesExist() {
  const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
  
  try {
    await dynamoDBClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    logger.debug(`✓ Products table exists`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('Products table does not exist. Please run migrations first.');
    }
    throw error;
  }
}

/**
 * Run seed data
 * @param {boolean} force - Force seed even if already applied
 * @returns {Promise<boolean>} - Returns true if seed was run, false if skipped
 */
export async function runSeed(force = false) {
  try {
    // Check if seed has already been applied
    if (!force && await isSeedApplied()) {
      logger.info('Seed data has already been applied. Use force=true to re-run.');
      return false;
    }

    logger.info('Starting database seeding...');
    
    // Verify tables exist
    await verifyTablesExist();
    
    // Load seed data
    const seedData = await loadSeedData();
    
    // Seed products only
    const productResult = await seedProducts(seedData.products || []);
    
    // Mark seed as applied
    await markSeedApplied();
    
    logger.info('Database seeding completed successfully!', {
      products: productResult,
      total: { seeded: productResult.seeded, skipped: productResult.skipped },
    });
    
    return true;
  } catch (error) {
    logger.error('Database seeding failed:');
    logger.error('Error message:', error.message);
    logger.error('Error name:', error.name);
    logger.error('Error code:', error.code);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    if (error.cause) {
      logger.error('Error cause:', error.cause);
    }
    if (error.$metadata) {
      logger.error('AWS SDK metadata:', error.$metadata);
    }
    throw error;
  }
}

/**
 * Reset seed (remove seed tracking - does not delete data)
 */
export async function resetSeed() {
  try {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    await dynamoClient.send(new DeleteCommand({
      TableName: SEEDS_TABLE,
      Key: { id: SEED_ID },
    }));
    logger.info('Seed tracking reset. Seed will run on next execution.');
  } catch (error) {
    logger.error({ err: error }, 'Error resetting seed tracking');
    throw error;
  }
}
