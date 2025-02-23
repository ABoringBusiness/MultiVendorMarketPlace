import { Router } from 'express';
import {
  getSellerReviews,
  createReview,
  deleteReview
} from '../controllers/reviewController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/sellers/:id', getSellerReviews);

// Protected routes - only check authentication
router.post('/sellers/:id/create', isAuthenticated, createReview);
router.delete('/:id/delete', isAuthenticated, deleteReview);

export default router;
