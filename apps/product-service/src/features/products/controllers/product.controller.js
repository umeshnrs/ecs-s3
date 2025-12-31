import { productService } from '../services/product.service.js';
import { logger } from '../../../shared/utils/logger.util.js';
import { singleResourceResponse, listResourceResponse, errorResponse } from '../../../shared/utils/response.util.js';

/**
 * Product Controller
 * Request handling layer
 */
export class ProductController {
  /**
   * Get product by ID
   */
  async getById(request, reply) {
    try {
      const { id } = request.params;
      const product = await productService.getById(id);

      if (!product) {
        reply.code(404);
        return errorResponse('Product not found', 404, request.id);
      }

      return singleResourceResponse('product', product, request.id);
    } catch (error) {
      logger.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * List products
   */
  async list(request, reply) {
    try {
      const { limit = 20, lastKey } = request.query;

      const result = await productService.list({
        limit: parseInt(limit, 10),
        lastKey: lastKey ? JSON.parse(decodeURIComponent(lastKey)) : undefined,
      });

      return listResourceResponse(
        'products',
        result.products,
        {
          limit: parseInt(limit, 10),
          lastKey: result.lastKey,
          total: result.total,
        },
        request.id
      );
    } catch (error) {
      logger.error('Error in list:', error);
      throw error;
    }
  }
}

export const productController = new ProductController();

