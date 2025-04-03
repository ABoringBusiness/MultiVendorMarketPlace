const express = require("express");
const {
  placeBid,
  getAuctionBids,
  getUserBids,
  getHighestBid
} = require("../controllers/bidController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bids
 *   description: Bid management endpoints
 */

/**
 * @swagger
 * /api/bids/{auctionId}:
 *   post:
 *     summary: Place a bid on an auction
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionId
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Bid amount
 *     responses:
 *       200:
 *         description: Bid placed successfully
 *       400:
 *         description: Invalid bid amount or auction not active
 *       404:
 *         description: Auction not found
 */
router.post("/:auctionId", authMiddleware, placeBid);

/**
 * @swagger
 * /api/bids/user:
 *   get:
 *     summary: Get all bids placed by the authenticated user
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bids
 */
router.get("/user", authMiddleware, getUserBids);

/**
 * @swagger
 * /api/bids/{auctionId}:
 *   get:
 *     summary: Get all bids for an auction
 *     tags: [Bids]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bids for the auction
 *       404:
 *         description: Auction not found
 */
router.get("/:auctionId", getAuctionBids);

/**
 * @swagger
 * /api/bids/{auctionId}/highest:
 *   get:
 *     summary: Get the highest bid for an auction
 *     tags: [Bids]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Highest bid information
 *       404:
 *         description: Auction not found
 */
router.get("/:auctionId/highest", getHighestBid);

module.exports = router;