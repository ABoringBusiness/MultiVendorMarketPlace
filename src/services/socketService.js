const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Join user's room
    socket.join(`user:${socket.user.id}`);
    
    // Join room based on user role
    socket.join(`role:${socket.user.role}`);
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Send notification to a specific user
const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.to(`user:${userId}`).emit('notification', notification);
};

// Send notification to all users with a specific role
const sendNotificationToRole = (role, notification) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.to(`role:${role}`).emit('notification', notification);
};

// Send notification to all connected users
const sendNotificationToAll = (notification) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.emit('notification', notification);
};

// Send event to a specific user
const sendEventToUser = (userId, eventName, data) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.to(`user:${userId}`).emit(eventName, data);
};

module.exports = {
  initializeSocket,
  getIO,
  sendNotificationToUser,
  sendNotificationToRole,
  sendNotificationToAll,
  sendEventToUser
};