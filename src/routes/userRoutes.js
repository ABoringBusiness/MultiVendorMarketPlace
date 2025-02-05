// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const {
  getProfile,
  updateProfile,
  deleteProfile,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} = require('../controllers/userController');

// Routes for the currently logged-in user
/**
 * @swagger
 * tags:
 *   name: User
 *   description: Endpoints for user self-service and admin user management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *       404:
 *         description: User not found.
 */
router.get('/me', authMiddleware, getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               password:
 *                 type: string
 *                 example: newSecret123
 *     responses:
 *       200:
 *         description: User profile updated successfully.
 *       404:
 *         description: User not found.
 */
router.put('/me', authMiddleware, updateProfile);
/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete the current user's account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully.
 *       404:
 *         description: User not found.
 */
router.delete('/me', authMiddleware, deleteProfile);

// Admin-only routes
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users.
 */
router.get('/', authMiddleware, isAdmin, getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID.
 *     responses:
 *       200:
 *         description: User data retrieved successfully.
 *       404:
 *         description: User not found.
 */
router.get('/:id', authMiddleware, isAdmin, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user by ID (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *             example:
 *               name: Updated Name
 *               role: admin
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       404:
 *         description: User not found.
 */
router.put('/:id', authMiddleware, isAdmin, updateUserById);
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 */
router.delete('/:id', authMiddleware, isAdmin, deleteUserById);

module.exports = router;
