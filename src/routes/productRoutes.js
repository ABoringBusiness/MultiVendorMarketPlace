'use strict';
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/auth'); // Ensure you have an auth middleware

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product & Inventory Management endpoints
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (Vendor)
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
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Awesome Product"
 *               description:
 *                 type: string
 *                 example: "A detailed description of the awesome product."
 *               price:
 *                 type: number
 *                 example: 99.99
 *               inventory_quantity:
 *                 type: number
 *                 example: 50
 *               category:
 *                 type: string
 *                 example: "Electronics"
 *               image_url:
 *                 type: string
 *                 example: "https://example.com/product.jpg"
 *     responses:
 *       201:
 *         description: Product created successfully.
 */
router.post('/', authMiddleware, productController.createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve a list of all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: A list of products.
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Retrieve product details by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID.
 *     responses:
 *       200:
 *         description: Product details.
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product (Vendor)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               inventory_quantity:
 *                 type: number
 *               category:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully.
 */
router.put('/:id', authMiddleware, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product (Vendor)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID.
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 */
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
