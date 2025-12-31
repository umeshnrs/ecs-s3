import Tables from './tables.config.js';

/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */
export const config = {
  // Server configuration
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // AWS Configuration
  awsRegion: process.env.AWS_REGION || 'ap-south-1',
  
  // DynamoDB Configuration
  dynamodb: {
    databaseName: Tables.getDatabaseName(),
    environment: Tables.getEnvironment(),
    tables: {
      products: Tables.PRODUCTS,
    },
    // Legacy support
    tableName: Tables.PRODUCTS,
    endpoint: process.env.DYNAMODB_ENDPOINT,
  },
  
  // Redis Configuration
  redis: {
    endpoint: process.env.REDIS_ENDPOINT,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    authToken: process.env.REDIS_AUTH_TOKEN,
    enabled: process.env.REDIS_ENABLED !== 'false',
    ttlProduct: parseInt(process.env.REDIS_TTL_PRODUCT || '600', 10), // 10 minutes
    ttlList: parseInt(process.env.REDIS_TTL_LIST || '300', 10), // 5 minutes
  },
  
  // S3 Configuration
  s3: {
    imagesBucket: process.env.S3_IMAGES_BUCKET,
    endpoint: process.env.S3_ENDPOINT,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
    maxFileSize: parseInt(process.env.S3_MAX_FILE_SIZE || '20971520', 10),
  },
  
  // Lambda Configuration
  lambda: {
    imageProcessorArn: process.env.LAMBDA_IMAGE_PROCESSOR_ARN,
  },
  
  // Cognito Configuration
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    region: process.env.AWS_REGION || 'ap-south-1',
    endpoint: process.env.NODE_ENV === 'development' 
      ? process.env.COGNITO_ENDPOINT || 'http://localstack:4566'
      : undefined,
  },
  
  // Application Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Migration Configuration
  autoMigrate: process.env.AUTO_MIGRATE === 'true',
  autoSeed: process.env.AUTO_SEED === 'true',
};

