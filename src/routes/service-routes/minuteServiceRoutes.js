const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  createMinuteService,
  getMinuteServices,
  getMinuteService,
  updateMinuteService,
  deleteMinuteService,
  startServiceSession,
  stopServiceSession,
  getActiveSessions,
  getSessionHistory
} = require('../../controllers/service-controllers/minuteServiceController');

/**
 * @swagger
 * /api/services/minute:
 *   post:
 *     summary: Create a new minute-based service
 *     tags: [Minute Services]
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
 *               - ratePerMinute
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               ratePerMinute:
 *                 type: number
 *               minimumMinutes:
 *                 type: integer
 *               maximumMinutes:
 *                 type: integer
 *               maximumCharge:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('seller', 'admin'), createMinuteService);

/**
 * @swagger
 * /api/services/minute:
 *   get:
 *     summary: Get all minute-based services
 *     tags: [Minute Services]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: minRate
 *         schema:
 *           type: number
 *         description: Minimum rate per minute
 *       - in: query
 *         name: maxRate
 *         schema:
 *           type: number
 *         description: Maximum rate per minute
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: Provider ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/', getMinuteServices);

/**
 * @swagger
 * /api/services/minute/{id}:
 *   get:
 *     summary: Get a single minute-based service
 *     tags: [Minute Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 */
router.get('/:id', getMinuteService);

/**
 * @swagger
 * /api/services/minute/{id}:
 *   put:
 *     summary: Update a minute-based service
 *     tags: [Minute Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
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
 *               ratePerMinute:
 *                 type: number
 *               minimumMinutes:
 *                 type: integer
 *               maximumMinutes:
 *                 type: integer
 *               maximumCharge:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Not authorized
 */
router.put('/:id', protect, authorize('seller', 'admin'), updateMinuteService);

/**
 * @swagger
 * /api/services/minute/{id}:
 *   delete:
 *     summary: Delete a minute-based service
 *     tags: [Minute Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Not authorized
 */
router.delete('/:id', protect, authorize('seller', 'admin'), deleteMinuteService);

/**
 * @swagger
 * /api/services/minute/{id}/start:
 *   post:
 *     summary: Start a service session
 *     tags: [Minute Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       201:
 *         description: Session started successfully
 *       404:
 *         description: Service not found
 *       400:
 *         description: Already have an active session
 *       401:
 *         description: Not authorized
 */
router.post('/:id/start', protect, startServiceSession);

/**
 * @swagger
 * /api/services/sessions/{id}/stop:
 *   put:
 *     summary: Stop a service session
 *     tags: [Minute Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session stopped successfully
 *       404:
 *         description: Session not found
 *       401:
 *         description: Not authorized
 */
router.put('/sessions/:id/stop', protect, stopServiceSession);

/**
 * @swagger
 * /api/services/sessions/active:
 *   get:
 *     summary: Get user's active sessions
 *     tags: [Minute Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *       401:
 *         description: Not authorized
 */
router.get('/sessions/active', protect, getActiveSessions);

/**
 * @swagger
 * /api/services/sessions/history:
 *   get:
 *     summary: Get user's session history
 *     tags: [Minute Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of sessions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of sessions to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Session history
 *       401:
 *         description: Not authorized
 */
router.get('/sessions/history', protect, getSessionHistory);

module.exports = router;