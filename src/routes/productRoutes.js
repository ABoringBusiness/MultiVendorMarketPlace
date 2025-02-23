const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Seller only)
 *     tags: [Product]
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
 *               - price
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post("/", authMiddleware, createProduct);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Filter by minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Filter by maximum price
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by title or description
 *     responses:
 *       200:
 *         description: List of filtered products
 */
router.get("/", getAllProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product (Seller only)
 *     tags: [Product]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put("/:id", authMiddleware, updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (Seller only)
 *     tags: [Product]
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
 *         description: Product deleted successfully
 */
router.delete("/:id", authMiddleware, deleteProduct);

/**
 * @swagger
 * /products/{id}/toggle-status:
 *   post:
 *     summary: Toggle enable/disable a product
 *     tags: [Product]
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
 *         description: Product status updated successfully
 *       403:
 *         description: Unauthorized action
 *       404:
 *         description: Product not found
 */
router.post("/:id/toggle-status", authMiddleware, toggleProductStatus);

module.exports = router;
