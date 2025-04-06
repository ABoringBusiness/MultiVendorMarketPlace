const express = require("express");
const {
  startServiceUsage,
  stopServiceUsage,
  getUserServiceUsage,
  generateBilling,
  getUserBilling,
  getBillingById,
  updateBillingStatus,
  getServiceStats
} = require("../controllers/serviceController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Service usage and billing endpoints
 */

/**
 * @swagger
 * /api/services/start:
 *   post:
 *     summary: Start service usage tracking
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceType
 *             properties:
 *               serviceType:
 *                 type: string
 *                 enum: [auction, premium_listing, featured_product, marketplace]
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Service usage tracking started
 *       400:
 *         description: Invalid service type
 */
router.post("/start", authMiddleware, startServiceUsage);

/**
 * @swagger
 * /api/services/{id}/stop:
 *   put:
 *     summary: Stop service usage tracking
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service usage tracking stopped
 *       404:
 *         description: Active service usage not found
 */
router.put("/:id/stop", authMiddleware, stopServiceUsage);

/**
 * @swagger
 * /api/services/usage:
 *   get:
 *     summary: Get user's service usage history
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, billed]
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [auction, premium_listing, featured_product, marketplace]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of service usage records
 */
router.get("/usage", authMiddleware, getUserServiceUsage);

/**
 * @swagger
 * /api/services/billing/generate:
 *   post:
 *     summary: Generate billing for completed service usage (admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - billingPeriodStart
 *               - billingPeriodEnd
 *               - dueDate
 *             properties:
 *               userId:
 *                 type: string
 *               billingPeriodStart:
 *                 type: string
 *                 format: date
 *               billingPeriodEnd:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Billing generated successfully
 *       400:
 *         description: Missing required fields or invalid billing period
 *       404:
 *         description: User not found or no unbilled service usage found
 */
router.post("/billing/generate", authMiddleware, adminMiddleware, generateBilling);

/**
 * @swagger
 * /api/services/billing:
 *   get:
 *     summary: Get user's billing history
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled]
 *     responses:
 *       200:
 *         description: List of billing records
 */
router.get("/billing", authMiddleware, getUserBilling);

/**
 * @swagger
 * /api/services/billing/{id}:
 *   get:
 *     summary: Get billing details by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Billing details
 *       404:
 *         description: Billing not found
 */
router.get("/billing/:id", authMiddleware, getBillingById);

/**
 * @swagger
 * /api/services/billing/{id}:
 *   put:
 *     summary: Update billing status (admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum: [pending, paid, overdue, cancelled]
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Billing status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Billing not found
 */
router.put("/billing/:id", authMiddleware, adminMiddleware, updateBillingStatus);

/**
 * @swagger
 * /api/services/stats:
 *   get:
 *     summary: Get service usage statistics
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Service usage statistics
 */
router.get("/stats", authMiddleware, getServiceStats);

module.exports = router;