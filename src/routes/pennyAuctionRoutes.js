const express = require("express");
const {
  createPennyAuction,
  getAllPennyAuctions,
  getPennyAuctionById,
  getSellerPennyAuctions,
  updatePennyAuction,
  cancelPennyAuction,
  getWonPennyAuctions,
  getBiddingPennyAuctions,
  completePennyAuction,
  getPennyAuctionStats
} = require("../controllers/pennyAuctionController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const sellerMiddleware = require("../middleware/sellerMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Penny Auctions
 *   description: Penny auction management endpoints
 */

/**
 * @swagger
 * /api/penny-auctions:
 *   post:
 *     summary: Create a new penny auction (seller only)
 *     tags: [Penny Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - categoryId
 *               - retailPrice
 *               - startTime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               retailPrice:
 *                 type: number
 *               startingPrice:
 *                 type: number
 *               bidIncrement:
 *                 type: number
 *               bidCost:
 *                 type: number
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               timerSeconds:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *               featured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Penny auction created successfully
 *       400:
 *         description: Invalid input or user already has 5 active penny auctions
 */
router.post("/", authMiddleware, sellerMiddleware, createPennyAuction);

/**
 * @swagger
 * /api/penny-auctions:
 *   get:
 *     summary: Get all penny auctions with optional filters
 *     tags: [Penny Auctions]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *         description: Filter by auction status (default is active)
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum current price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum current price
 *     responses:
 *       200:
 *         description: List of penny auctions
 */
router.get("/", getAllPennyAuctions);

/**
 * @swagger
 * /api/penny-auctions/seller:
 *   get:
 *     summary: Get penny auctions created by the authenticated seller
 *     tags: [Penny Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's penny auctions
 */
router.get("/seller", authMiddleware, sellerMiddleware, getSellerPennyAuctions);

/**
 * @swagger
 * /api/penny-auctions/won:
 *   get:
 *     summary: Get penny auctions won by the authenticated user
 *     tags: [Penny Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of won penny auctions
 */
router.get("/won", authMiddleware, getWonPennyAuctions);

/**
 * @swagger
 * /api/penny-auctions/bidding:
 *   get:
 *     summary: Get penny auctions the authenticated user has bid on
 *     tags: [Penny Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of penny auctions with user's bids
 */
router.get("/bidding", authMiddleware, getBiddingPennyAuctions);

/**
 * @swagger
 * /api/penny-auctions/stats:
 *   get:
 *     summary: Get penny auction statistics (admin only)
 *     tags: [Penny Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Penny auction statistics
 */
router.get("/stats", authMiddleware, adminMiddleware, getPennyAuctionStats);

/**
 * @swagger
 * /api/penny-auctions/{id}:
 *   get:
 *     summary: Get penny auction details by ID
 *     tags: [Penny Auctions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Penny auction details
 *       404:
 *         description: Penny auction not found
 */
router.get("/:id", getPennyAuctionById);

/**
 * @swagger
 * /api/penny-auctions/{id}:
 *   put:
 *     summary: Update penny auction details (seller only, before auction starts)
 *     tags: [Penny Auctions]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               retailPrice:
 *                 type: number
 *               startingPrice:
 *                 type: number
 *               bidIncrement:
 *                 type: number
 *               bidCost:
 *                 type: number
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               timerSeconds:
 *                 type: integer
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Penny auction updated successfully
 *       400:
 *         description: Cannot update after auction has started
 *       403:
 *         description: Not authorized to update this penny auction
 *       404:
 *         description: Penny auction not found
 */
router.put("/:id", authMiddleware, updatePennyAuction);

/**
 * @swagger
 * /api/penny-auctions/{id}:
 *   delete:
 *     summary: Cancel penny auction (seller only, if no bids)
 *     tags: [Penny Auctions]
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
 *         description: Penny auction cancelled successfully
 *       400:
 *         description: Cannot cancel penny auction with existing bids
 *       403:
 *         description: Not authorized to cancel this penny auction
 *       404:
 *         description: Penny auction not found
 */
router.delete("/:id", authMiddleware, cancelPennyAuction);

/**
 * @swagger
 * /api/penny-auctions/{id}/complete:
 *   put:
 *     summary: Complete a penny auction (admin only)
 *     tags: [Penny Auctions]
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
 *         description: Penny auction completed successfully
 *       400:
 *         description: Only active penny auctions can be completed
 *       404:
 *         description: Penny auction not found
 */
router.put("/:id/complete", authMiddleware, adminMiddleware, completePennyAuction);

module.exports = router;