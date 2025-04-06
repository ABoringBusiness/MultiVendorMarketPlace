const express = require("express");
const { 
  createCheckoutSession, 
  handleWebhook, 
  getPaymentStatus 
} = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing endpoints
 */

/**
 * @swagger
 * /api/payments/checkout:
 *   post:
 *     summary: Create a Stripe checkout session for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session created
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 */
router.post("/checkout", authMiddleware, createCheckoutSession);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid webhook signature
 */
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

/**
 * @swagger
 * /api/payments/status/{orderId}:
 *   get:
 *     summary: Get payment status for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 *       404:
 *         description: Order not found
 */
router.get("/status/:orderId", authMiddleware, getPaymentStatus);

module.exports = router;