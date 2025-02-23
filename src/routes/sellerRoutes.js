const express = require("express");
const { getSellers, toggleSellerStatus } = require("../controllers/sellerController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/**
 * @swagger
 * /sellers:
 *   get:
 *     summary: Get all sellers
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sellers
 */
router.get("/", authMiddleware, getSellers);

/**
 * @swagger
 * /sellers/{id}/toggle-status:
 *   post:
 *     summary: Toggle enable/disable a seller (Admin only)
 *     tags: [Seller]
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
 *         description: Seller status updated successfully
 *       403:
 *         description: Access denied. Admins only.
 *       404:
 *         description: Seller not found.
 */
router.post("/:id/toggle-status", authMiddleware, adminMiddleware, toggleSellerStatus);

module.exports = router;
