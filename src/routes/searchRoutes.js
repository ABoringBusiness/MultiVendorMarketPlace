const express = require("express");
const { searchProducts, getProductSuggestions } = require("../controllers/searchController");

const router = express.Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for products with filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for product title or description
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
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
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, oldest]
 *         description: Sort products by price or date
 *     responses:
 *       200:
 *         description: List of filtered products
 */
router.get("/", searchProducts);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get product title suggestions based on search query
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for product title
 *     responses:
 *       200:
 *         description: List of product title suggestions
 */
router.get("/suggestions", getProductSuggestions);

module.exports = router;