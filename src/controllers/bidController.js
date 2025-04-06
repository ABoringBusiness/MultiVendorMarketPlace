const { Auction, Bid, User, Category } = require("../models");

// @desc Place a bid on an auction
// @route POST /api/bids/:auctionId
exports.placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;
    
    // Validate bid amount
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Please provide a valid bid amount" });
    }
    
    // Find the auction
    const auction = await Auction.findByPk(auctionId);
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Check if auction is active
    if (auction.status !== 'active') {
      return res.status(400).json({ message: "Auction is not active" });
    }
    
    // Check if auction has ended
    if (new Date(auction.endTime) < new Date()) {
      return res.status(400).json({ message: "Auction has ended" });
    }
    
    // Check if user is the seller
    if (auction.sellerId === userId) {
      return res.status(400).json({ message: "You cannot bid on your own auction" });
    }
    
    // Check if bid amount is valid
    const bidAmount = parseFloat(amount);
    
    if (bidAmount <= auction.currentBid) {
      return res.status(400).json({ 
        message: "Bid amount must be higher than the current bid",
        currentBid: auction.currentBid
      });
    }
    
    if (auction.currentBid === 0 && bidAmount < auction.startingBid) {
      return res.status(400).json({ 
        message: "Bid amount must be at least the starting bid",
        startingBid: auction.startingBid
      });
    }
    
    // Check if user already has a bid on this auction
    const existingBid = await Bid.findOne({
      where: {
        auctionId,
        bidderId: userId
      }
    });
    
    // Transaction to update or create bid
    if (existingBid) {
      // Update existing bid
      existingBid.amount = bidAmount;
      await existingBid.save();
    } else {
      // Create new bid
      await Bid.create({
        auctionId,
        bidderId: userId,
        amount: bidAmount
      });
    }
    
    // Update auction with new highest bid
    auction.currentBid = bidAmount;
    auction.highestBidderId = userId;
    await auction.save();
    
    // Get updated auction with bids
    const updatedAuction = await Auction.findByPk(auctionId, {
      include: [
        { 
          model: Bid, 
          as: "bids",
          include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
          order: [['amount', 'DESC']]
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: "Bid placed successfully",
      currentBid: bidAmount,
      auction: updatedAuction
    });
  } catch (error) {
    console.error("Place bid error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all bids for an auction
// @route GET /api/bids/:auctionId
exports.getAuctionBids = async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    // Check if auction exists
    const auction = await Auction.findByPk(auctionId);
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Get all bids for the auction
    const bids = await Bid.findAll({
      where: { auctionId },
      include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
      order: [['amount', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (error) {
    console.error("Get auction bids error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's bids
// @route GET /api/bids/user
exports.getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all bids by the user
    const bids = await Bid.findAll({
      where: { bidderId: userId },
      include: [
        { 
          model: Auction, 
          as: "auction",
          include: [
            { model: User, as: "seller", attributes: ["id", "name"] },
            { model: Category, attributes: ["id", "name"] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (error) {
    console.error("Get user bids error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get highest bid for an auction
// @route GET /api/bids/:auctionId/highest
exports.getHighestBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    // Check if auction exists
    const auction = await Auction.findByPk(auctionId);
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Get highest bid
    const highestBid = await Bid.findOne({
      where: { auctionId },
      order: [['amount', 'DESC']],
      include: [{ model: User, as: "bidder", attributes: ["id", "name"] }]
    });
    
    if (!highestBid) {
      return res.status(200).json({
        success: true,
        message: "No bids yet",
        startingBid: auction.startingBid
      });
    }
    
    res.status(200).json({
      success: true,
      highestBid
    });
  } catch (error) {
    console.error("Get highest bid error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};