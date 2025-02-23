import express from 'express';
import { searchProducts } from '../controllers/searchController.js';

const router = express.Router();

// GET /api/v1/search - Search products with filters
router.get('/', searchProducts);

export default router;
