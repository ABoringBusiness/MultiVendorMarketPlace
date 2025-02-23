import { Router } from 'express';
import {
  searchProducts,
  getProductsByCategory,
  getProductsByPriceRange
} from '../controllers/searchController.js';

const router = Router();

// Public search routes
router.get('/', searchProducts);
router.get('/category/:id', getProductsByCategory);
router.get('/price-range', getProductsByPriceRange);

export default router;
