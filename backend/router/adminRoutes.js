import { Router } from 'express';
import {
  disableSeller,
  disableProduct,
  updateOrderStatus
} from '../controllers/adminController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All routes require admin role
router.use(isAuthenticated, isAuthorized(ROLES.ADMIN));

router.post('/sellers/:id/disable', disableSeller);
router.post('/products/:id/disable', disableProduct);
router.put('/orders/:id/update-status', updateOrderStatus);

export default router;
