import { Router } from 'express';
import {
  createOrder,
  getBuyerOrders,
  getOrderDetails,
  updateOrderStatus,
  handleStripeWebhook
} from '../controllers/orderController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';
import express from 'express';

const router = Router();

// Protected routes
router.post('/create', isAuthenticated, createOrder);
router.get('/list', isAuthenticated, getBuyerOrders);
router.get('/:id', isAuthenticated, getOrderDetails);
router.put('/:id/update-status', isAuthenticated, isAuthorized(ROLES.SELLER, ROLES.ADMIN), updateOrderStatus);

// Stripe webhook
router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

export default router;
