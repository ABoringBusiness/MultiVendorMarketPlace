import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  disableProduct
} from '../controllers/productController.js';

const router = express.Router();

router.get('/list', listProducts);
router.get('/:id', getProduct);
router.post('/create', isAuthenticated, createProduct);
router.put('/:id/update', isAuthenticated, updateProduct);
router.post('/:id/disable', isAuthenticated, disableProduct);

export default router;
