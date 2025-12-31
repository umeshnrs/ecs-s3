import dynamoose from 'dynamoose';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { logger } from '../../shared/utils/logger.util.js';
import Tables, { 
  TABLE_NAME
} from '../../config/tables.config.js';

const clientConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

// Use local DynamoDB endpoint if provided (for local development)
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  };
}

const client = new DynamoDBClient(clientConfig);

export const dynamoClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Export the low-level client for table management operations
export const dynamoDBClient = client;

// Export table names from centralized configuration
export { 
  Tables,
  TABLE_NAME
};

// Initialize Dynamoose
dynamoose.aws.ddb.set(client);

// Set Dynamoose to use local endpoint if provided
if (process.env.DYNAMODB_ENDPOINT) {
  dynamoose.aws.ddb.local(process.env.DYNAMODB_ENDPOINT);
}

/**
 * Wait for DynamoDB to be ready
 */
export async function waitForDynamoDB(maxAttempts = 30, delayMs = 2000) {
  const endpoint = process.env.DYNAMODB_ENDPOINT;
  if (!endpoint) {
    // Not using local DynamoDB, assume it's ready
    return true;
  }

  logger.info('Waiting for DynamoDB to be ready...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to list tables as a simple connectivity check
      const { ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
      await client.send(new ListTablesCommand({}));
      logger.info('DynamoDB is ready!');
      return true;
    } catch (error) {
      if (attempt < maxAttempts) {
        logger.debug(`DynamoDB not ready yet (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        logger.error('DynamoDB failed to become ready after maximum attempts');
        throw new Error(`DynamoDB not ready after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
  
  return false;
}

export async function checkReadiness() {
  try {
    // Simple check - try to describe the main products table
    const command = new DescribeTableCommand({
      TableName: TABLE_NAME,
    });
    await client.send(command);
    logger.info(`DynamoDB table ready: ${TABLE_NAME}`);
    logger.info(`Environment: ${Tables.getEnvironment()}, Database: ${Tables.getDatabaseName()}`);
    return true;
  } catch (error) {
    logger.error('Readiness check failed:', error);
    return false;
  }
}
