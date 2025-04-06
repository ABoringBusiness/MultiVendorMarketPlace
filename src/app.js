const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");
const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const searchRoutes = require("./routes/searchRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const pennyAuctionRoutes = require("./routes/pennyAuctionRoutes");
const pennyBidRoutes = require("./routes/pennyBidRoutes");
const bidPackageRoutes = require("./routes/bidPackageRoutes");

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

// Parse JSON requests, but keep raw body for Stripe webhooks
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook' || req.originalUrl === '/api/bid-packages/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/penny-auctions", pennyAuctionRoutes);
app.use("/api/penny-bids", pennyBidRoutes);
app.use("/api/bid-packages", bidPackageRoutes);

// Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? null : err.message
  });
});

// Scheduled task to update auction statuses
const updateAuctionStatuses = async () => {
  try {
    const { Auction, Bid } = require("./models");
    const { Op } = require("sequelize");
    const now = new Date();
    
    // Update pending auctions to active if start time has passed
    await Auction.update(
      { status: 'active' },
      { 
        where: { 
          status: 'pending',
          startTime: { [Op.lte]: now },
          endTime: { [Op.gt]: now }
        }
      }
    );
    
    // Update active auctions to completed if end time has passed
    const completedAuctions = await Auction.findAll({
      where: {
        status: 'active',
        endTime: { [Op.lte]: now }
      },
      include: [
        { model: Bid, as: 'bids', required: false }
      ]
    });
    
    // Process each completed auction
    for (const auction of completedAuctions) {
      auction.status = 'completed';
      
      // If there are bids, set the highest bidder
      if (auction.bids && auction.bids.length > 0) {
        // Find highest bid
        const highestBid = auction.bids.reduce((prev, current) => 
          (prev.amount > current.amount) ? prev : current
        );
        
        auction.highestBidderId = highestBid.bidderId;
        auction.currentBid = highestBid.amount;
      }
      
      await auction.save();
    }
    
    console.log(`Auction status update: ${completedAuctions.length} auctions completed`);
  } catch (error) {
    console.error("Error updating auction statuses:", error);
  }
};

// Run auction status update every minute
setInterval(updateAuctionStatuses, 60000);

// Run once at startup
updateAuctionStatuses();

module.exports = app;
