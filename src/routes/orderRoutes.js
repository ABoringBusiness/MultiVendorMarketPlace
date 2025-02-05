'use strict';
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Endpoints for managing orders
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               shipping_address:
 *                 type: string
 *                 example: "123 Main Street, City, Country"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully.
 */
router.post('/', authMiddleware, orderController.createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Retrieve all orders for the authenticated user
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of orders.
 */
router.get('/', authMiddleware, orderController.getUserOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Retrieve order details by ID
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID.
 *     responses:
 *       200:
 *         description: Order details.
 *       404:
 *         description: Order not found.
 */
router.get('/:id', authMiddleware, orderController.getOrderById);

module.exports = router;
