import dynamoose from 'dynamoose';
import { TABLE_NAME } from '../../../config/tables.config.js';

/**
 * Product Model
 * DynamoDB schema for products
 */
const productSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
    index: {
      name: 'name-index',
      type: 'global',
    },
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: '',
    index: {
      name: 'category-index',
      type: 'global',
    },
  },
  stock: {
    type: Number,
    default: 0,
  },
  images: {
    type: Array,
    schema: [String],
    default: [],
  },
  brand: {
    type: String,
    default: '',
  },
  sku: {
    type: String,
    default: '',
  },
  colors: {
    type: Array,
    schema: [String],
    default: [],
  },
  sizes: {
    type: Array,
    schema: [String],
    default: [],
  },
  tags: {
    type: Array,
    schema: [String],
    default: [],
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive', 'draft'],
    index: {
      name: 'status-index',
      type: 'global',
    },
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: String,
    default: null,
  },
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false, // We handle timestamps manually
});

export const Product = dynamoose.model(TABLE_NAME, productSchema);

