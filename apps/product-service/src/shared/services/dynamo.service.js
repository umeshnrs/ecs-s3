import { dynamoClient, TABLE_NAME } from '../../infrastructure/database/client.js';
import { GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger.util.js';

export class DynamoService {
  /**
   * Get item by ID
   */
  async getById(id, includeDeleted = false) {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      });

      const result = await dynamoClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      // Filter soft-deleted items unless explicitly included
      if (!includeDeleted && result.Item.isDeleted === true) {
        return null;
      }

      return result.Item;
    } catch (error) {
      logger.error('Error getting item by ID:', error);
      throw error;
    }
  }

  /**
   * Create or update item
   */
  async put(item) {
    try {
      const now = new Date().toISOString();
      const itemToSave = {
        ...item,
        updatedAt: now,
        createdAt: item.createdAt || now,
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: itemToSave,
      });

      await dynamoClient.send(command);
      return itemToSave;
    } catch (error) {
      logger.error('Error putting item:', error);
      throw error;
    }
  }

  /**
   * Update item
   */
  async update(id, updates) {
    try {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = updates[key];
      });

      // Always update updatedAt
      updateExpression.push(`#updatedAt = :updatedAt`);
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const result = await dynamoClient.send(command);
      return result.Attributes;
    } catch (error) {
      logger.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Soft delete item
   */
  async softDelete(id) {
    try {
      return await this.update(id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error soft deleting item:', error);
      throw error;
    }
  }

  /**
   * Restore soft-deleted item
   */
  async restore(id) {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'REMOVE isDeleted, deletedAt SET #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      });

      const result = await dynamoClient.send(command);
      return result.Attributes;
    } catch (error) {
      logger.error('Error restoring item:', error);
      throw error;
    }
  }

  /**
   * Query items with pagination
   */
  async query(params) {
    try {
      const {
        indexName,
        keyConditionExpression,
        filterExpression,
        expressionAttributeNames,
        expressionAttributeValues,
        limit,
        lastKey,
        includeDeleted = false,
      } = params;

      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
        ExclusiveStartKey: lastKey,
      });

      const result = await dynamoClient.send(command);

      // Filter soft-deleted items unless explicitly included
      let items = result.Items || [];
      if (!includeDeleted) {
        items = items.filter(item => item.isDeleted !== true);
      }

      return {
        items,
        lastKey: result.LastEvaluatedKey,
        count: items.length,
      };
    } catch (error) {
      logger.error('Error querying items:', error);
      throw error;
    }
  }

  /**
   * Scan items with pagination
   */
  async scan(params) {
    try {
      const {
        filterExpression,
        expressionAttributeNames,
        expressionAttributeValues,
        limit,
        lastKey,
        includeDeleted = false,
      } = params;

      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
        ExclusiveStartKey: lastKey,
      });

      const result = await dynamoClient.send(command);

      // Filter soft-deleted items unless explicitly included
      let items = result.Items || [];
      if (!includeDeleted) {
        items = items.filter(item => item.isDeleted !== true);
      }

      return {
        items,
        lastKey: result.LastEvaluatedKey,
        count: items.length,
      };
    } catch (error) {
      logger.error('Error scanning items:', error);
      throw error;
    }
  }
}

export const dynamoService = new DynamoService();

