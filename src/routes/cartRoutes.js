'use strict';
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Endpoints for managing the shopping cart
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart retrieved successfully.
 */
router.get('/', authMiddleware, cartController.getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add an item to the current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added to cart successfully.
 */
router.post('/items', authMiddleware, cartController.addItemToCart);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   put:
 *     summary: Update the quantity of a cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cart item ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully.
 */
router.put('/items/:id', authMiddleware, cartController.updateCartItem);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   delete:
 *     summary: Remove a cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cart item ID.
 *     responses:
 *       200:
 *         description: Item removed from cart successfully.
 */
router.delete('/items/:id', authMiddleware, cartController.removeCartItem);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear the current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully.
 */
router.delete('/clear', authMiddleware, cartController.clearCart);

module.exports = router;
