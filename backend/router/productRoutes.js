import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductDetails,
  updateProduct,
  disableProduct,
  getSellerProducts,
  searchProducts
} from '../controllers/productController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/list', getAllProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductDetails);
router.get('/seller/:id', getSellerProducts);

// Protected routes
router.post('/create', isAuthenticated, createProduct);
router.put('/:id/update', isAuthenticated, updateProduct);
router.post('/:id/disable', isAuthenticated, disableProduct);

export default router;
