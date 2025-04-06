const express = require("express");
const {
  placePennyBid,
  getPennyAuctionBids,
  getUserPennyBids,
  configureAutoBid,
  stopAutoBid,
  getPennyAuctionBidStats
} = require("../controllers/pennyBidController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Penny Bids
 *   description: Penny bid management endpoints
 */

/**
 * @swagger
 * /api/penny-bids/{pennyAuctionId}:
 *   post:
 *     summary: Place a bid on a penny auction
 *     tags: [Penny Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pennyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Penny bid placed successfully
 *       400:
 *         description: Invalid input, auction not active, or insufficient bid balance
 *       404:
 *         description: Penny auction not found
 */
router.post("/:pennyAuctionId", authMiddleware, placePennyBid);

/**
 * @swagger
 * /api/penny-bids/{pennyAuctionId}:
 *   get:
 *     summary: Get all bids for a penny auction
 *     tags: [Penny Bids]
 *     parameters:
 *       - in: path
 *         name: pennyAuctionId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: List of bids for the penny auction
 *       404:
 *         description: Penny auction not found
 */
router.get("/:pennyAuctionId", getPennyAuctionBids);

/**
 * @swagger
 * /api/penny-bids/user:
 *   get:
 *     summary: Get user's penny bids
 *     tags: [Penny Bids]
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
 *     responses:
 *       200:
 *         description: List of user's penny bids
 */
router.get("/user", authMiddleware, getUserPennyBids);

/**
 * @swagger
 * /api/penny-bids/{pennyAuctionId}/auto-bid:
 *   post:
 *     summary: Configure auto-bidding for a penny auction
 *     tags: [Penny Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pennyAuctionId
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
 *               - maxBids
 *             properties:
 *               maxBids:
 *                 type: integer
 *                 minimum: 1
 *               stopWhenOutbid:
 *                 type: boolean
 *               bidDelaySec:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Auto-bidding configured successfully
 *       400:
 *         description: Invalid input or auction not active
 *       404:
 *         description: Penny auction not found
 */
router.post("/:pennyAuctionId/auto-bid", authMiddleware, configureAutoBid);

/**
 * @swagger
 * /api/penny-bids/{pennyAuctionId}/auto-bid:
 *   delete:
 *     summary: Stop auto-bidding for a penny auction
 *     tags: [Penny Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pennyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auto-bidding stopped successfully
 *       404:
 *         description: Active auto-bidding configuration not found
 */
router.delete("/:pennyAuctionId/auto-bid", authMiddleware, stopAutoBid);

/**
 * @swagger
 * /api/penny-bids/{pennyAuctionId}/stats:
 *   get:
 *     summary: Get bid statistics for a penny auction
 *     tags: [Penny Bids]
 *     parameters:
 *       - in: path
 *         name: pennyAuctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bid statistics for the penny auction
 *       404:
 *         description: Penny auction not found
 */
router.get("/:pennyAuctionId/stats", getPennyAuctionBidStats);

module.exports = router;