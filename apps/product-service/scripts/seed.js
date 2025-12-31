import dotenv from 'dotenv';
import { runSeed, resetSeed } from '../src/database/seeds/runner.js';
import { logger } from '../src/shared/utils/logger.util.js';
import { waitForDynamoDB } from '../src/infrastructure/database/client.js';

dotenv.config();

const command = process.argv[2] || 'run';
const force = process.argv.includes('--force') || process.argv.includes('-f');

async function main() {
  try {
    switch (command) {
      case 'run':
        // Wait for DynamoDB to be ready before running seed
        await waitForDynamoDB();
        await runSeed(force);
        logger.info('Seed command completed');
        process.exit(0);
        break;
      
      case 'reset':
        await resetSeed();
        logger.info('Seed tracking reset completed');
        process.exit(0);
        break;
      
      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Usage: node scripts/seed.js [run|reset] [--force]');
        process.exit(1);
    }
  } catch (error) {
    logger.error({ err: error }, 'Seed script failed');
    process.exit(1);
  }
}

main();
