const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MultiVendor Marketplace API',
      version: '1.0.0',
      description: 'API documentation for MultiVendor Marketplace',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const searchRoutes = require('./routes/searchRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

// Import use case routes
const minuteServiceRoutes = require('./routes/service-routes/minuteServiceRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/services', serviceRoutes);

// Mount use case routes
app.use('/api/services/minute', minuteServiceRoutes);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join user-specific room for targeted events
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Handle service session events
  socket.on('start-session', (data) => {
    const { sessionId, userId, providerId } = data;
    io.to(`user-${userId}`).to(`user-${providerId}`).emit('session-started', data);
  });
  
  socket.on('stop-session', (data) => {
    const { sessionId, userId, providerId } = data;
    io.to(`user-${userId}`).to(`user-${providerId}`).emit('session-stopped', data);
  });
  
  // Handle auction events
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`Client joined auction room: ${auctionId}`);
  });
  
  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
    console.log(`Client left auction room: ${auctionId}`);
  });
  
  socket.on('new-bid', (data) => {
    io.to(`auction-${data.auctionId}`).emit('bid-placed', data);
  });
  
  // Handle notification events
  socket.on('send-notification', (data) => {
    const { recipientId, notification } = data;
    io.to(`user-${recipientId}`).emit('new-notification', notification);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error',
  });
});

// Export app and server
module.exports = { app, server, io };