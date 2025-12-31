import { productController } from '../controllers/product.controller.js';

/**
 * Product Routes
 * GET /api/v1/products - List products (filters: limit, lastKey)
 * GET /api/v1/products/:id - Get product by ID
 */
async function productRoutes(fastify, options) {
  // GET /api/v1/products - List products
  fastify.get('/', async (request, reply) => {
    return await productController.list(request, reply);
  });

  // GET /api/v1/products/:id - Get product by ID
  fastify.get('/:id', async (request, reply) => {
    return await productController.getById(request, reply);
  });
}

export default productRoutes;

