const express = require("express");
const {
  createAuction,
  getAllAuctions,
  getAuctionById,
  getSellerAuctions,
  updateAuction,
  cancelAuction,
  extendAuctionEndTime,
  getWonAuctions,
  getBiddingAuctions
} = require("../controllers/auctionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auctions
 *   description: Auction management endpoints
 */

/**
 * @swagger
 * /api/auctions:
 *   post:
 *     summary: Create a new auction
 *     tags: [Auctions]
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
 *               - condition
 *               - startingBid
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [new, like-new, good, fair, poor]
 *               startingBid:
 *                 type: number
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Auction created successfully
 *       400:
 *         description: Invalid input or user already has 3 active auctions
 */
router.post("/", authMiddleware, createAuction);

/**
 * @swagger
 * /api/auctions:
 *   get:
 *     summary: Get all auctions with optional filters
 *     tags: [Auctions]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *         description: Filter by seller ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum starting bid
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum starting bid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *         description: Filter by auction status (default is active)
 *     responses:
 *       200:
 *         description: List of auctions
 */
router.get("/", getAllAuctions);

/**
 * @swagger
 * /api/auctions/seller:
 *   get:
 *     summary: Get auctions created by the authenticated seller
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's auctions
 */
router.get("/seller", authMiddleware, getSellerAuctions);

/**
 * @swagger
 * /api/auctions/won:
 *   get:
 *     summary: Get auctions won by the authenticated user
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of won auctions
 */
router.get("/won", authMiddleware, getWonAuctions);

/**
 * @swagger
 * /api/auctions/bidding:
 *   get:
 *     summary: Get auctions the authenticated user has bid on
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of auctions with user's bids
 */
router.get("/bidding", authMiddleware, getBiddingAuctions);

/**
 * @swagger
 * /api/auctions/{id}:
 *   get:
 *     summary: Get auction details by ID
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auction details
 *       404:
 *         description: Auction not found
 */
router.get("/:id", getAuctionById);

/**
 * @swagger
 * /api/auctions/{id}:
 *   put:
 *     summary: Update auction details (seller only, before auction starts)
 *     tags: [Auctions]
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
 *               condition:
 *                 type: string
 *                 enum: [new, like-new, good, fair, poor]
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Auction updated successfully
 *       400:
 *         description: Cannot update after auction has started
 *       403:
 *         description: Not authorized to update this auction
 *       404:
 *         description: Auction not found
 */
router.put("/:id", authMiddleware, updateAuction);

/**
 * @swagger
 * /api/auctions/{id}:
 *   delete:
 *     summary: Cancel auction (seller only, if no bids)
 *     tags: [Auctions]
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
 *         description: Auction cancelled successfully
 *       400:
 *         description: Cannot cancel auction with existing bids
 *       403:
 *         description: Not authorized to cancel this auction
 *       404:
 *         description: Auction not found
 */
router.delete("/:id", authMiddleware, cancelAuction);

/**
 * @swagger
 * /api/auctions/{id}/extend:
 *   post:
 *     summary: Extend auction end time to prevent sniping
 *     tags: [Auctions]
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
 *         description: Auction end time extended or no extension needed
 *       400:
 *         description: Can only extend active auctions
 *       404:
 *         description: Auction not found
 */
router.post("/:id/extend", authMiddleware, extendAuctionEndTime);

module.exports = router;