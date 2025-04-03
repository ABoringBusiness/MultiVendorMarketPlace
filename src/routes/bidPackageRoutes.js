const express = require("express");
const {
  createBidPackage,
  getAllBidPackages,
  getBidPackageById,
  updateBidPackage,
  deleteBidPackage,
  purchaseBidPackage,
  handleStripeWebhook,
  getUserBidBalance,
  getUserBidTransactions,
  addFreeBids
} = require("../controllers/bidPackageController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bid Packages
 *   description: Bid package management endpoints
 */

/**
 * @swagger
 * /api/bid-packages:
 *   post:
 *     summary: Create a new bid package (admin only)
 *     tags: [Bid Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - bidCount
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               bidCount:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *               discountPercentage:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               featured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Bid package created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", authMiddleware, adminMiddleware, createBidPackage);

/**
 * @swagger
 * /api/bid-packages:
 *   get:
 *     summary: Get all bid packages
 *     tags: [Bid Packages]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of bid packages
 */
router.get("/", getAllBidPackages);

/**
 * @swagger
 * /api/bid-packages/balance:
 *   get:
 *     summary: Get user's bid balance
 *     tags: [Bid Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's bid balance and recent transactions
 */
router.get("/balance", authMiddleware, getUserBidBalance);

/**
 * @swagger
 * /api/bid-packages/transactions:
 *   get:
 *     summary: Get user's bid transaction history
 *     tags: [Bid Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [purchase, use, refund, bonus, expiry]
 *     responses:
 *       200:
 *         description: User's bid transaction history
 */
router.get("/transactions", authMiddleware, getUserBidTransactions);

/**
 * @swagger
 * /api/bid-packages/webhook:
 *   post:
 *     summary: Handle Stripe webhook for bid package purchase
 *     tags: [Bid Packages]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid webhook signature
 */
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

/**
 * @swagger
 * /api/bid-packages/add-free-bids:
 *   post:
 *     summary: Add free bids to user (admin only)
 *     tags: [Bid Packages]
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
 *               - bidCount
 *             properties:
 *               userId:
 *                 type: string
 *               bidCount:
 *                 type: integer
 *                 minimum: 1
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Free bids added successfully
 *       400:
 *         description: Invalid input
 */
router.post("/add-free-bids", authMiddleware, adminMiddleware, addFreeBids);

/**
 * @swagger
 * /api/bid-packages/{id}:
 *   get:
 *     summary: Get bid package by ID
 *     tags: [Bid Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bid package details
 *       404:
 *         description: Bid package not found
 */
router.get("/:id", getBidPackageById);

/**
 * @swagger
 * /api/bid-packages/{id}:
 *   put:
 *     summary: Update bid package (admin only)
 *     tags: [Bid Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               bidCount:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *               isActive:
 *                 type: boolean
 *               discountPercentage:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bid package updated successfully
 *       404:
 *         description: Bid package not found
 */
router.put("/:id", authMiddleware, adminMiddleware, updateBidPackage);

/**
 * @swagger
 * /api/bid-packages/{id}:
 *   delete:
 *     summary: Delete bid package (admin only)
 *     tags: [Bid Packages]
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
 *         description: Bid package deactivated successfully
 *       404:
 *         description: Bid package not found
 */
router.delete("/:id", authMiddleware, adminMiddleware, deleteBidPackage);

/**
 * @swagger
 * /api/bid-packages/{id}/purchase:
 *   post:
 *     summary: Purchase a bid package
 *     tags: [Bid Packages]
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
 *         description: Stripe checkout session created
 *       400:
 *         description: Bid package not available
 *       404:
 *         description: Bid package not found
 */
router.post("/:id/purchase", authMiddleware, purchaseBidPackage);

module.exports = router;