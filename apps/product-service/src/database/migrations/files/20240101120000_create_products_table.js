import { CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';

export default {
  async up(dynamoDBClient, tableName) {
    // Create the products table using AWS SDK
    try {
      const command = new CreateTableCommand({
        TableName: tableName,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'category', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'S' },
          { AttributeName: 'price', AttributeType: 'N' },
          { AttributeName: 'sku', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'category-index',
            KeySchema: [
              { AttributeName: 'category', KeyType: 'HASH' },
              { AttributeName: 'createdAt', KeyType: 'RANGE' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
          {
            IndexName: 'price-index',
            KeySchema: [
              { AttributeName: 'category', KeyType: 'HASH' },
              { AttributeName: 'price', KeyType: 'RANGE' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
          {
            IndexName: 'sku-index',
            KeySchema: [
              { AttributeName: 'sku', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
          {
            IndexName: 'status-createdAt-index',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'createdAt', KeyType: 'RANGE' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamEnabled: true,
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });

      await dynamoDBClient.send(command);
    } catch (error) {
      // If table already exists, that's okay
      if (error.name !== 'ResourceInUseException' && error.code !== 'ResourceInUseException') {
        throw error;
      }
    }
  },

  async down(dynamoDBClient, tableName) {
    // Delete the products table
    try {
      const command = new DeleteTableCommand({
        TableName: tableName,
      });
      await dynamoDBClient.send(command);
    } catch (error) {
      // If table doesn't exist, that's okay
      if (error.name !== 'ResourceNotFoundException' && error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }
  },
};

