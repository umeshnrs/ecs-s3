import { Product } from '../models/product.model.js';
import { logger } from '../../../shared/utils/logger.util.js';

/**
 * Product Repository
 * Data access layer - handles all database operations
 */
export class ProductRepository {
  /**
   * Find product by ID
   */
  async findById(id) {
    try {
      const product = await Product.get(id);
      return product ? product.toJSON() : null;
    } catch (error) {
      logger.error('Repository error - findById:', error);
      throw error;
    }
  }

  /**
   * Find all products with pagination
   */
  async findAll(options = {}) {
    try {
      const { limit = 20, lastKey } = options;
      
      const scan = Product.scan();
      
      if (lastKey) {
        scan.startAt(lastKey);
      }

      const result = await scan.limit(parseInt(limit, 10)).exec();
      
      return {
        items: result.map(item => item.toJSON()),
        lastKey: result.lastKey,
      };
    } catch (error) {
      logger.error('Repository error - findAll:', error);
      throw error;
    }
  }

  /**
   * Create product
   */
  async create(productData) {
    try {
      const product = new Product(productData);
      const saved = await product.save();
      return saved.toJSON();
    } catch (error) {
      logger.error('Repository error - create:', error);
      throw error;
    }
  }
}

export const productRepository = new ProductRepository();

