const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getSellerDashboard,
  getSellerProducts,
  getSellerOrders,
  updateOrderStatus,
  getSellerReviews,
  respondToReview,
  getSellerInventory,
  updateInventory,
  getSellerProfile,
  updateSellerProfile
} = require('../../controllers/admin/sellerAdminController');

/**
 * @swagger
 * tags:
 *   name: Seller Admin
 *   description: Seller admin panel endpoints
 */

/**
 * @swagger
 * /api/admin/seller/dashboard:
 *   get:
 *     summary: Get seller dashboard statistics
 *     tags: [Seller Admin]
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
router.get('/dashboard', protect, authorize('seller'), getSellerDashboard);

/**
 * @swagger
 * /api/admin/seller/products:
 *   get:
 *     summary: Get seller products
 *     tags: [Seller Admin]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Product status
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/products', protect, authorize('seller'), getSellerProducts);

/**
 * @swagger
 * /api/admin/seller/orders:
 *   get:
 *     summary: Get seller orders
 *     tags: [Seller Admin]
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
router.get('/orders', protect, authorize('seller'), getSellerOrders);

/**
 * @swagger
 * /api/admin/seller/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Seller Admin]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Order not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/orders/:id/status', protect, authorize('seller'), updateOrderStatus);

/**
 * @swagger
 * /api/admin/seller/reviews:
 *   get:
 *     summary: Get seller reviews
 *     tags: [Seller Admin]
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
router.get('/reviews', protect, authorize('seller'), getSellerReviews);

/**
 * @swagger
 * /api/admin/seller/reviews/{id}/respond:
 *   post:
 *     summary: Respond to a review
 *     tags: [Seller Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response added successfully
 *       400:
 *         description: Response is required
 *       404:
 *         description: Review not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/reviews/:id/respond', protect, authorize('seller'), respondToReview);

/**
 * @swagger
 * /api/admin/seller/inventory:
 *   get:
 *     summary: Get seller inventory
 *     tags: [Seller Admin]
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
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter low stock items
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/inventory', protect, authorize('seller'), getSellerInventory);

/**
 * @swagger
 * /api/admin/seller/inventory/{id}:
 *   put:
 *     summary: Update inventory
 *     tags: [Seller Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockQuantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       404:
 *         description: Product not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/inventory/:id', protect, authorize('seller'), updateInventory);

/**
 * @swagger
 * /api/admin/seller/profile:
 *   get:
 *     summary: Get seller profile
 *     tags: [Seller Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Seller not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/profile', protect, authorize('seller'), getSellerProfile);

/**
 * @swagger
 * /api/admin/seller/profile:
 *   put:
 *     summary: Update seller profile
 *     tags: [Seller Admin]
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
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *               banner:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Seller not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/profile', protect, authorize('seller'), updateSellerProfile);

module.exports = router;