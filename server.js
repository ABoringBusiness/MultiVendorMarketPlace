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

sequelize.authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.error("Database connection failed:", err));

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
