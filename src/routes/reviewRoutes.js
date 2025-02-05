'use strict';
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/auth'); // Protect routes

/**
 * @swagger
 * tags:
 *   name: Review
 *   description: Endpoints for managing reviews and ratings
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review for a product
 *     tags: [Review]
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
 *               - rating
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               rating:
 *                 type: integer
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Excellent product!"
 *     responses:
 *       201:
 *         description: Review created successfully.
 */
router.post('/', authMiddleware, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/product/{product_id}:
 *   get:
 *     summary: Get all reviews for a specific product
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the product.
 *     responses:
 *       200:
 *         description: A list of reviews for the product.
 */
router.get('/product/:product_id', reviewController.getReviewsForProduct);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the review to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Good product, but could be improved."
 *     responses:
 *       200:
 *         description: Review updated successfully.
 */
router.put('/:id', authMiddleware, reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the review to delete.
 *     responses:
 *       200:
 *         description: Review deleted successfully.
 */
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
