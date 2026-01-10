const express = require("express");
const app = require("./src/app");
const http = require("http");
const sequelize = require("./src/config/database");
const socketService = require("./src/services/socketService");
const convexService = require("./src/services/convexService");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO (keep for now, will be replaced by Convex subscriptions)
socketService.initializeSocket(server);

// Initialize Convex (NEW)
const convexEnabled = convexService.initializeConvex();
if (convexEnabled) {
  console.log("✅ Convex backend enabled - hybrid mode active");
} else {
  console.log("⚠️  Convex not configured - using PostgreSQL only");
}

// Make convex service available globally
app.locals.convex = convexService;
app.locals.useConvex = convexEnabled;

// Connect to PostgreSQL (keep as fallback)
sequelize
  .authenticate()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => console.error("❌ PostgreSQL connection failed:", err));

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`\n📊 Backend Mode: ${convexEnabled ? "CONVEX + PostgreSQL (hybrid)" : "PostgreSQL only"}`);
});
