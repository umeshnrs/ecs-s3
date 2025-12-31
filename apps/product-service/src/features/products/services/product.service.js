import { productRepository } from '../repositories/product.repository.js';
import { cacheService } from '../../../shared/services/cache.service.js';
import { config } from '../../../config/environment.config.js';
import { logger } from '../../../shared/utils/logger.util.js';

/**
 * Product Service
 * Business logic layer
 */
export class ProductService {
  /**
   * Get product by ID
   */
  async getById(id) {
    // Try cache first
    const cacheKey = cacheService.productKey(id);
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      // Filter out deleted and inactive products
      if (cached.isDeleted || cached.status !== 'active') {
        return null;
      }
      logger.debug('Cache hit for product:', id);
      return cached;
    }

    // Get from database
    const product = await productRepository.findById(id);
    
    if (!product || product.isDeleted || product.status !== 'active') {
      return null;
    }

    // Cache product
    await cacheService.set(cacheKey, product, config.redis.ttlProduct);

    return product;
  }

  /**
   * List products with pagination
   */
  async list(params) {
    const { limit = 20, lastKey } = params;

    // Try cache first
    const cacheKey = cacheService.productListKey(null, limit, lastKey, false);
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      logger.debug('Cache hit for product list');
      return cached;
    }

    // Get from database
    const result = await productRepository.findAll({ limit, lastKey });
    
    // Filter out deleted and inactive products
    const activeProducts = result.items.filter(
      item => !item.isDeleted && item.status === 'active'
    );
    
    const response = {
      products: activeProducts,
      lastKey: result.lastKey,
      total: activeProducts.length,
    };

    // Cache response
    await cacheService.set(cacheKey, response, config.redis.ttlList);

    return response;
  }
}

export const productService = new ProductService();

