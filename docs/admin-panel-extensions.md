# Extending the Admin Panel APIs

This guide provides instructions for extending the admin panel APIs to support additional features and use cases.

## 1. Adding New Endpoints

To add new endpoints to the admin panel APIs:

1. Create a new controller function in the appropriate controller file:

```javascript
// Example: Add a new endpoint to get seller analytics
// In src/controllers/admin/sellerAdminController.js

exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { period = 'month' } = req.query;
    
    // Implement analytics logic here
    const analytics = await generateSellerAnalytics(sellerId, period);
    
    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

2. Add the new route in the appropriate routes file:

```javascript
// In src/routes/admin/sellerAdminRoutes.js

/**
 * @swagger
 * /api/admin/seller/analytics:
 *   get:
 *     summary: Get seller analytics
 *     tags: [Seller Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/analytics', protect, authorize('seller'), getSellerAnalytics);
```

## 2. Supporting New Use Cases

### Minute-Based Services Integration

To integrate the minute-based services with the admin panel:

1. Add a new controller for service provider dashboard:

```javascript
// Create src/controllers/admin/serviceProviderAdminController.js

exports.getServiceProviderDashboard = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    // Get service statistics
    const totalServices = await MinuteService.count({ where: { providerId } });
    const activeServices = await MinuteService.count({ where: { providerId, isActive: true } });
    
    // Get session statistics
    const totalSessions = await ServiceSession.count({
      where: { providerId, status: 'completed' }
    });
    
    const totalMinutes = await ServiceSession.sum('durationMinutes', {
      where: { providerId, status: 'completed' }
    }) || 0;
    
    const totalRevenue = await ServiceSession.sum('amount', {
      where: { providerId, status: 'completed' }
    }) || 0;
    
    // Get recent sessions
    const recentSessions = await ServiceSession.findAll({
      where: { providerId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: MinuteService, as: 'service' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      success: true,
      data: {
        services: {
          total: totalServices,
          active: activeServices
        },
        sessions: {
          total: totalSessions,
          totalMinutes,
          totalRevenue
        },
        recentSessions
      }
    });
  } catch (error) {
    console.error('Service provider dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

2. Create routes for the service provider admin panel:

```javascript
// Create src/routes/admin/serviceProviderAdminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getServiceProviderDashboard
  // Add other controller functions here
} = require('../../controllers/admin/serviceProviderAdminController');

router.get('/dashboard', protect, authorize('provider'), getServiceProviderDashboard);

// Add other routes here

module.exports = router;
```

3. Update the main admin routes file:

```javascript
// In src/routes/admin/index.js

const serviceProviderAdminRoutes = require('./serviceProviderAdminRoutes');

// Mount service provider admin routes
router.use('/provider', serviceProviderAdminRoutes);
```

### Digital Products Integration

To integrate digital products with the admin panel:

1. Add digital product management endpoints to the seller admin controller:

```javascript
// In src/controllers/admin/sellerAdminController.js

exports.getDigitalProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const whereConditions = { sellerId };
    
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get digital products with pagination
    const { count, rows: products } = await DigitalProduct.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.status(200).json({
      success: true,
      count,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get digital products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

2. Add the routes to the seller admin routes file:

```javascript
// In src/routes/admin/sellerAdminRoutes.js

/**
 * @swagger
 * /api/admin/seller/digital-products:
 *   get:
 *     summary: Get seller digital products
 *     tags: [Seller Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Digital products retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/digital-products', protect, authorize('seller'), getDigitalProducts);
```

## 3. Adding Real-time Features

To enhance the admin panel with more real-time features:

1. Add Socket.IO event handlers in the app.js file:

```javascript
// In src/app-with-admin.js

// Handle inventory updates
socket.on('inventory-update', (data) => {
  const { productId, sellerId, stockQuantity, price } = data;
  
  // Broadcast to all connected seller dashboards
  io.to(`dashboard-${sellerId}-seller`).emit('inventory-updated', {
    productId,
    stockQuantity,
    price,
    timestamp: new Date()
  });
});

// Handle service session events
socket.on('service-session-update', (data) => {
  const { sessionId, providerId, userId, status, duration, amount } = data;
  
  // Notify both provider and user
  io.to(`user-${providerId}`).emit('session-update', data);
  io.to(`user-${userId}`).emit('session-update', data);
  
  // Update provider dashboard
  io.to(`dashboard-${providerId}-provider`).emit('session-updated', {
    sessionId,
    status,
    duration,
    amount,
    timestamp: new Date()
  });
});
```

2. Implement client-side Socket.IO integration for real-time updates:

```javascript
// Example React component with real-time inventory updates

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [socket, setSocket] = useState(null);
  const sellerId = localStorage.getItem('userId');
  
  useEffect(() => {
    // Fetch initial inventory data
    fetchInventory();
    
    // Set up Socket.IO connection
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);
    
    // Join seller dashboard room
    socketInstance.emit('join-dashboard', sellerId, 'seller');
    
    // Listen for inventory updates
    socketInstance.on('inventory-updated', (data) => {
      // Update inventory item in state
      setInventory(prevInventory => 
        prevInventory.map(item => 
          item.id === data.productId 
            ? { ...item, stockQuantity: data.stockQuantity, price: data.price }
            : item
        )
      );
      
      // Show notification
      showNotification(`Product #${data.productId} updated`);
    });
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [sellerId]);
  
  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/seller/inventory', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      setInventory(data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };
  
  const updateInventoryItem = async (productId, stockQuantity, price) => {
    try {
      await fetch(`http://localhost:5000/api/admin/seller/inventory/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stockQuantity, price })
      });
      
      // Emit socket event for real-time update
      socket.emit('inventory-update', {
        productId,
        sellerId,
        stockQuantity,
        price
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };
  
  // Component rendering code...
}
```

## 4. Implementing Analytics

To add advanced analytics to the admin panel:

1. Create utility functions for generating analytics:

```javascript
// Create src/utils/analyticsHelpers.js

const { Order, Product, Review, ServiceSession, Sequelize } = require('../models');
const { Op } = Sequelize;

/**
 * Generate sales analytics for a seller
 * @param {string} sellerId - Seller ID
 * @param {string} period - Period (day, week, month, year)
 * @returns {Object} - Sales analytics
 */
exports.generateSalesAnalytics = async (sellerId, period) => {
  // Calculate date range based on period
  const endDate = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'week':
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'year':
      startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'month':
    default:
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);
      break;
  }
  
  // Get sales data
  const salesData = await Order.findAll({
    attributes: [
      [Sequelize.fn('date_trunc', period === 'day' ? 'hour' : 'day', Sequelize.col('createdAt')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
      [Sequelize.fn('SUM', Sequelize.col('total')), 'revenue']
    ],
    include: [
      {
        model: Product,
        as: 'products',
        where: { sellerId },
        required: true
      }
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    },
    group: [Sequelize.fn('date_trunc', period === 'day' ? 'hour' : 'day', Sequelize.col('createdAt'))],
    order: [[Sequelize.literal('date'), 'ASC']],
    raw: true
  });
  
  // Get product performance
  const productPerformance = await Product.findAll({
    attributes: [
      'id',
      'title',
      [Sequelize.fn('COUNT', Sequelize.col('orders.id')), 'orderCount'],
      [Sequelize.fn('SUM', Sequelize.col('OrderItem.quantity')), 'totalQuantity'],
      [Sequelize.fn('SUM', Sequelize.literal('OrderItem.price * OrderItem.quantity')), 'revenue']
    ],
    include: [
      {
        model: Order,
        as: 'orders',
        attributes: [],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      }
    ],
    where: { sellerId },
    group: ['Product.id'],
    order: [[Sequelize.literal('revenue'), 'DESC']],
    limit: 10
  });
  
  return {
    period,
    startDate,
    endDate,
    salesData,
    productPerformance
  };
};

/**
 * Generate service analytics for a provider
 * @param {string} providerId - Provider ID
 * @param {string} period - Period (day, week, month, year)
 * @returns {Object} - Service analytics
 */
exports.generateServiceAnalytics = async (providerId, period) => {
  // Similar implementation for service analytics
  // ...
};
```

2. Use these utility functions in the admin controllers:

```javascript
// In src/controllers/admin/sellerAdminController.js

const { generateSalesAnalytics } = require('../../utils/analyticsHelpers');

exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { period = 'month' } = req.query;
    
    // Generate analytics
    const analytics = await generateSalesAnalytics(sellerId, period);
    
    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

## 5. Security Enhancements

To enhance the security of the admin panel APIs:

1. Implement rate limiting:

```javascript
// Create src/middleware/rateLimitMiddleware.js

const rateLimit = require('express-rate-limit');

// Create rate limiter for admin panel APIs
const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = adminApiLimiter;
```

2. Apply rate limiting to admin routes:

```javascript
// In src/routes/admin/index.js

const adminApiLimiter = require('../../middleware/rateLimitMiddleware');

// Apply rate limiting to all admin routes
router.use(adminApiLimiter);
```

3. Implement additional authorization checks:

```javascript
// Create src/middleware/advancedAuthMiddleware.js

const advancedAuthorize = (requiredRole, resourceType) => {
  return async (req, res, next) => {
    try {
      // Basic role check
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Resource ownership check for specific endpoints
      if (resourceType && req.params.id) {
        let resource;
        
        switch (resourceType) {
          case 'product':
            resource = await Product.findByPk(req.params.id);
            if (!resource || resource.sellerId !== req.user.id) {
              return res.status(403).json({ message: 'Access denied' });
            }
            break;
            
          case 'order':
            resource = await Order.findByPk(req.params.id);
            if (!resource || (req.user.role === 'buyer' && resource.buyerId !== req.user.id)) {
              return res.status(403).json({ message: 'Access denied' });
            }
            break;
            
          // Add other resource types as needed
        }
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
};

module.exports = advancedAuthorize;
```

4. Apply advanced authorization to sensitive routes:

```javascript
// In src/routes/admin/sellerAdminRoutes.js

const advancedAuthorize = require('../../middleware/advancedAuthMiddleware');

// Use advanced authorization for sensitive endpoints
router.put('/inventory/:id', protect, advancedAuthorize('seller', 'product'), updateInventory);
```