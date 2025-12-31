import { UpdateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

export default {
  async up(dynamoDBClient, tableName) {
    // Add missing indexes to existing products table
    // Note: DynamoDB requires adding indexes one at a time
    try {
      // First, check if the table exists and what indexes it has
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const tableDescription = await dynamoDBClient.send(describeCommand);
      const existingIndexes = (tableDescription.Table.GlobalSecondaryIndexes || []).map(idx => idx.IndexName);

      // Get existing attribute definitions
      const existingAttributes = (tableDescription.Table.AttributeDefinitions || []).map(attr => attr.AttributeName);
      const allAttributes = [...tableDescription.Table.AttributeDefinitions];

      // Add missing attribute definitions
      if (!existingAttributes.includes('price')) {
        allAttributes.push({ AttributeName: 'price', AttributeType: 'N' });
      }
      if (!existingAttributes.includes('sku')) {
        allAttributes.push({ AttributeName: 'sku', AttributeType: 'S' });
      }
      if (!existingAttributes.includes('status')) {
        allAttributes.push({ AttributeName: 'status', AttributeType: 'S' });
      }

      // Add price-index if it doesn't exist
      if (!existingIndexes.includes('price-index')) {
        const updateCommand = new UpdateTableCommand({
          TableName: tableName,
          AttributeDefinitions: allAttributes,
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: 'price-index',
                KeySchema: [
                  { AttributeName: 'category', KeyType: 'HASH' },
                  { AttributeName: 'price', KeyType: 'RANGE' },
                ],
                Projection: {
                  ProjectionType: 'ALL',
                },
              },
            },
          ],
        });
        await dynamoDBClient.send(updateCommand);
        // Wait a bit for the index to be created before adding the next one
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Re-describe to get updated state
      const updatedDescription = await dynamoDBClient.send(describeCommand);
      const updatedIndexes = (updatedDescription.Table.GlobalSecondaryIndexes || []).map(idx => idx.IndexName);
      const updatedAttributes = [...updatedDescription.Table.AttributeDefinitions];

      // Add sku-index if it doesn't exist
      if (!updatedIndexes.includes('sku-index')) {
        if (!updatedAttributes.find(attr => attr.AttributeName === 'sku')) {
          updatedAttributes.push({ AttributeName: 'sku', AttributeType: 'S' });
        }
        const updateCommand = new UpdateTableCommand({
          TableName: tableName,
          AttributeDefinitions: updatedAttributes,
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: 'sku-index',
                KeySchema: [
                  { AttributeName: 'sku', KeyType: 'HASH' },
                ],
                Projection: {
                  ProjectionType: 'ALL',
                },
              },
            },
          ],
        });
        await dynamoDBClient.send(updateCommand);
        // Wait a bit for the index to be created before adding the next one
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Re-describe again to get updated state
      const finalDescription = await dynamoDBClient.send(describeCommand);
      const finalIndexes = (finalDescription.Table.GlobalSecondaryIndexes || []).map(idx => idx.IndexName);
      const finalAttributes = [...finalDescription.Table.AttributeDefinitions];

      // Add status-createdAt-index if it doesn't exist
      if (!finalIndexes.includes('status-createdAt-index')) {
        if (!finalAttributes.find(attr => attr.AttributeName === 'status')) {
          finalAttributes.push({ AttributeName: 'status', AttributeType: 'S' });
        }
        const updateCommand = new UpdateTableCommand({
          TableName: tableName,
          AttributeDefinitions: finalAttributes,
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: 'status-createdAt-index',
                KeySchema: [
                  { AttributeName: 'status', KeyType: 'HASH' },
                  { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: {
                  ProjectionType: 'ALL',
                },
              },
            },
          ],
        });
        await dynamoDBClient.send(updateCommand);
      }
    } catch (error) {
      // If table doesn't exist, that's okay (migration will be skipped)
      if (error.name !== 'ResourceNotFoundException' && error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }
  },

  async down(dynamoDBClient, tableName) {
    // Remove the indexes (optional - usually not needed for rollback)
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const tableDescription = await dynamoDBClient.send(describeCommand);
      const existingIndexes = (tableDescription.Table.GlobalSecondaryIndexes || []).map(idx => idx.IndexName);

      const indexesToRemove = [];

      if (existingIndexes.includes('price-index')) {
        indexesToRemove.push({ Delete: { IndexName: 'price-index' } });
      }
      if (existingIndexes.includes('sku-index')) {
        indexesToRemove.push({ Delete: { IndexName: 'sku-index' } });
      }
      if (existingIndexes.includes('status-createdAt-index')) {
        indexesToRemove.push({ Delete: { IndexName: 'status-createdAt-index' } });
      }

      if (indexesToRemove.length > 0) {
        const updateCommand = new UpdateTableCommand({
          TableName: tableName,
          GlobalSecondaryIndexUpdates: indexesToRemove,
        });

        await dynamoDBClient.send(updateCommand);
      }
    } catch (error) {
      // If table doesn't exist, that's okay
      if (error.name !== 'ResourceNotFoundException' && error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }
  },
};

