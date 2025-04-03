const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getBuyerDashboard,
  getBuyerOrders,
  getOrderDetails,
  cancelOrder,
  getBuyerReviews,
  createOrUpdateReview,
  deleteReview,
  getBuyerWishlist,
  addToWishlist,
  removeFromWishlist,
  getBuyerProfile,
  updateBuyerProfile
} = require('../../controllers/admin/buyerAdminController');

/**
 * @swagger
 * tags:
 *   name: Buyer Admin
 *   description: Buyer admin panel endpoints
 */

/**
 * @swagger
 * /api/admin/buyer/dashboard:
 *   get:
 *     summary: Get buyer dashboard statistics
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/dashboard', protect, authorize('buyer'), getBuyerDashboard);

/**
 * @swagger
 * /api/admin/buyer/orders:
 *   get:
 *     summary: Get buyer orders
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Order status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/orders', protect, authorize('buyer'), getBuyerOrders);

/**
 * @swagger
 * /api/admin/buyer/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/orders/:id', protect, authorize('buyer'), getOrderDetails);

/**
 * @swagger
 * /api/admin/buyer/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/orders/:id/cancel', protect, authorize('buyer'), cancelOrder);

/**
 * @swagger
 * /api/admin/buyer/reviews:
 *   get:
 *     summary: Get buyer reviews
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/reviews', protect, authorize('buyer'), getBuyerReviews);

/**
 * @swagger
 * /api/admin/buyer/reviews:
 *   post:
 *     summary: Create or update review
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review created or updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/reviews', protect, authorize('buyer'), createOrUpdateReview);

/**
 * @swagger
 * /api/admin/buyer/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.delete('/reviews/:id', protect, authorize('buyer'), deleteReview);

/**
 * @swagger
 * /api/admin/buyer/wishlist:
 *   get:
 *     summary: Get buyer wishlist
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/wishlist', protect, authorize('buyer'), getBuyerWishlist);

/**
 * @swagger
 * /api/admin/buyer/wishlist:
 *   post:
 *     summary: Add to wishlist
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added to wishlist
 *       400:
 *         description: Product already in wishlist
 *       404:
 *         description: Product not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/wishlist', protect, authorize('buyer'), addToWishlist);

/**
 * @swagger
 * /api/admin/buyer/wishlist/{id}:
 *   delete:
 *     summary: Remove from wishlist
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist item ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Wishlist item not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.delete('/wishlist/:id', protect, authorize('buyer'), removeFromWishlist);

/**
 * @swagger
 * /api/admin/buyer/profile:
 *   get:
 *     summary: Get buyer profile
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Buyer not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/profile', protect, authorize('buyer'), getBuyerProfile);

/**
 * @swagger
 * /api/admin/buyer/profile:
 *   put:
 *     summary: Update buyer profile
 *     tags: [Buyer Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Buyer not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/profile', protect, authorize('buyer'), updateBuyerProfile);

module.exports = router;