import { Router } from 'express';
import {
  disableSeller,
  disableProduct,
  updateOrderStatus
} from '../controllers/adminController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Protected routes - only check authentication
router.post('/sellers/:id/disable', isAuthenticated, disableSeller);
router.post('/products/:id/disable', isAuthenticated, disableProduct);
router.put('/orders/:id/update-status', isAuthenticated, updateOrderStatus);

export default router;
