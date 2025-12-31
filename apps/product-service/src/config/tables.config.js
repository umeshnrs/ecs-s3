/**
 * Centralized DynamoDB Table Configuration
 */

/**
 * Get the database name
 */
function getDatabaseName() {
  return process.env.DYNAMODB_DATABASE_NAME || 'products';
}

/**
 * Get the environment
 */
function getEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * Table name constants
 * MVP: Only products table
 */
export const Tables = {
  PRODUCTS: 'products',
  getDatabaseName,
  getEnvironment,
};

/**
 * Main table name
 */
export const TABLE_NAME = Tables.PRODUCTS;

// Export default
export default Tables;

