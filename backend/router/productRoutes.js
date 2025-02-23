import express from 'express';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  disableProduct
} from '../controllers/productController.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Public routes
router.get('/list', listProducts);
router.get('/:id', getProduct);

// Protected routes
router.post('/create', isAuthenticated, isAuthorized(ROLES.SELLER), createProduct);
router.put('/:id/update', isAuthenticated, updateProduct);
router.post('/:id/disable', isAuthenticated, isAuthorized(ROLES.ADMIN), disableProduct);

export default router;
