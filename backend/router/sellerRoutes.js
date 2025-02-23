import { Router } from 'express';
import {
  getAllSellers,
  getSellerProfile,
  disableSeller
} from '../controllers/sellerController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/list', getAllSellers);
router.get('/:id', getSellerProfile);

// Admin only routes
router.post('/:id/disable', isAuthenticated, isAuthorized(ROLES.ADMIN), disableSeller);

export default router;
