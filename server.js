const express = require("express");
const app = require("./src/app");
const http = require('http');
const sequelize = require("./src/config/database");
const socketService = require('./src/services/socketService');
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socketService.initializeSocket(server);

// Connect to database
sequelize.authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.error("Database connection failed:", err));

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api/docs`);
});
