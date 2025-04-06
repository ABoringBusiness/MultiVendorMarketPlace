const { 
  PennyAuction, 
  PennyBid, 
  User, 
  UserBidBalance, 
  BidTransaction,
  AutoBidConfig
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// @desc Place a bid on a penny auction
// @route POST /api/penny-bids/:pennyAuctionId
exports.placePennyBid = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { pennyAuctionId } = req.params;
    const userId = req.user.id;
    
    // Find the penny auction
    const pennyAuction = await PennyAuction.findByPk(pennyAuctionId, { transaction: t });
    
    if (!pennyAuction) {
      await t.rollback();
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Check if auction is active
    if (pennyAuction.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ message: "Penny auction is not active" });
    }
    
    // Check if user is the seller
    if (pennyAuction.sellerId === userId) {
      await t.rollback();
      return res.status(400).json({ message: "You cannot bid on your own penny auction" });
    }
    
    // Get user's bid balance
    let userBidBalance = await UserBidBalance.findOne({
      where: { userId },
      transaction: t
    });
    
    // Create bid balance if it doesn't exist
    if (!userBidBalance) {
      userBidBalance = await UserBidBalance.create({
        userId,
        bidBalance: 0,
        totalBidsPurchased: 0,
        totalBidsUsed: 0
      }, { transaction: t });
    }
    
    // Check if user has enough bid balance
    if (userBidBalance.bidBalance < 1) {
      await t.rollback();
      return res.status(400).json({ 
        message: "Insufficient bid balance. Please purchase more bids.",
        bidBalance: userBidBalance.bidBalance
      });
    }
    
    // Calculate new price
    const newPrice = parseFloat((pennyAuction.currentPrice + pennyAuction.bidIncrement).toFixed(2));
    
    // Create penny bid
    const pennyBid = await PennyBid.create({
      pennyAuctionId,
      bidderId: userId,
      bidAmount: pennyAuction.bidIncrement,
      bidCost: pennyAuction.bidCost,
      newPrice,
      isAutoBid: false
    }, { transaction: t });
    
    // Update penny auction
    pennyAuction.currentPrice = newPrice;
    pennyAuction.highestBidderId = userId;
    pennyAuction.totalBids += 1;
    
    // If auction is about to end, extend the timer
    const now = new Date();
    if (pennyAuction.endTime && new Date(pennyAuction.endTime) - now < pennyAuction.timerSeconds * 1000) {
      pennyAuction.endTime = new Date(now.getTime() + pennyAuction.timerSeconds * 1000);
    } else if (!pennyAuction.endTime) {
      // If no end time is set, set it now
      pennyAuction.endTime = new Date(now.getTime() + pennyAuction.timerSeconds * 1000);
    }
    
    await pennyAuction.save({ transaction: t });
    
    // Update user's bid balance
    userBidBalance.bidBalance -= 1;
    userBidBalance.totalBidsUsed += 1;
    await userBidBalance.save({ transaction: t });
    
    // Create bid transaction record
    await BidTransaction.create({
      userId,
      transactionType: 'use',
      bidCount: 1,
      description: `Bid placed on penny auction: ${pennyAuction.title}`,
      metadata: {
        pennyAuctionId,
        pennyBidId: pennyBid.id,
        newPrice
      }
    }, { transaction: t });
    
    // Process auto-bids from other users
    await processAutoBids(pennyAuctionId, userId, t);
    
    await t.commit();
    
    // Get updated auction with bids
    const updatedAuction = await PennyAuction.findByPk(pennyAuctionId, {
      include: [
        { 
          model: PennyBid, 
          as: "bids",
          include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: "Penny bid placed successfully",
      currentPrice: newPrice,
      bidBalance: userBidBalance.bidBalance,
      pennyAuction: updatedAuction
    });
  } catch (error) {
    await t.rollback();
    console.error("Place penny bid error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to process auto-bids
async function processAutoBids(pennyAuctionId, currentBidderId, transaction) {
  try {
    // Find all active auto-bid configs for this auction except the current bidder
    const autoBidConfigs = await AutoBidConfig.findAll({
      where: {
        pennyAuctionId,
        userId: { [Op.ne]: currentBidderId },
        isActive: true,
        bidsUsed: { [Op.lt]: sequelize.col('maxBids') }
      },
      include: [
        { model: User, attributes: ["id"], include: [{ model: UserBidBalance, as: "bidBalance" }] }
      ],
      transaction
    });
    
    if (autoBidConfigs.length === 0) {
      return;
    }
    
    // Get the penny auction
    const pennyAuction = await PennyAuction.findByPk(pennyAuctionId, { transaction });
    
    // Process each auto-bid config
    for (const config of autoBidConfigs) {
      // Skip if user doesn't have enough bid balance
      if (!config.User.bidBalance || config.User.bidBalance.bidBalance < 1) {
        continue;
      }
      
      // Skip if max bids reached
      if (config.bidsUsed >= config.maxBids) {
        continue;
      }
      
      // Calculate new price
      const newPrice = parseFloat((pennyAuction.currentPrice + pennyAuction.bidIncrement).toFixed(2));
      
      // Create penny bid
      const pennyBid = await PennyBid.create({
        pennyAuctionId,
        bidderId: config.userId,
        bidAmount: pennyAuction.bidIncrement,
        bidCost: pennyAuction.bidCost,
        newPrice,
        isAutoBid: true
      }, { transaction });
      
      // Update penny auction
      pennyAuction.currentPrice = newPrice;
      pennyAuction.highestBidderId = config.userId;
      pennyAuction.totalBids += 1;
      
      // If auction is about to end, extend the timer
      const now = new Date();
      if (pennyAuction.endTime && new Date(pennyAuction.endTime) - now < pennyAuction.timerSeconds * 1000) {
        pennyAuction.endTime = new Date(now.getTime() + pennyAuction.timerSeconds * 1000);
      }
      
      await pennyAuction.save({ transaction });
      
      // Update user's bid balance
      const userBidBalance = config.User.bidBalance;
      userBidBalance.bidBalance -= 1;
      userBidBalance.totalBidsUsed += 1;
      await userBidBalance.save({ transaction });
      
      // Create bid transaction record
      await BidTransaction.create({
        userId: config.userId,
        transactionType: 'use',
        bidCount: 1,
        description: `Auto-bid placed on penny auction: ${pennyAuction.title}`,
        metadata: {
          pennyAuctionId,
          pennyBidId: pennyBid.id,
          newPrice,
          isAutoBid: true
        }
      }, { transaction });
      
      // Update auto-bid config
      config.bidsUsed += 1;
      
      // If max bids reached or stopWhenOutbid is true and user is outbid, deactivate auto-bid
      if (config.bidsUsed >= config.maxBids || (config.stopWhenOutbid && pennyAuction.highestBidderId !== config.userId)) {
        config.isActive = false;
      }
      
      await config.save({ transaction });
      
      // If this auto-bid outbid the original bidder, stop processing more auto-bids
      if (pennyAuction.highestBidderId !== currentBidderId) {
        break;
      }
    }
  } catch (error) {
    console.error("Process auto-bids error:", error);
    throw error;
  }
}

// @desc Get all bids for a penny auction
// @route GET /api/penny-bids/:pennyAuctionId
exports.getPennyAuctionBids = async (req, res) => {
  try {
    const { pennyAuctionId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if penny auction exists
    const pennyAuction = await PennyAuction.findByPk(pennyAuctionId);
    
    if (!pennyAuction) {
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get all bids for the penny auction
    const { count, rows: bids } = await PennyBid.findAndCountAll({
      where: { pennyAuctionId },
      include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      bids
    });
  } catch (error) {
    console.error("Get penny auction bids error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's penny bids
// @route GET /api/penny-bids/user
exports.getUserPennyBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get all bids by the user
    const { count, rows: bids } = await PennyBid.findAndCountAll({
      where: { bidderId: userId },
      include: [
        { 
          model: PennyAuction, 
          as: "pennyAuction",
          attributes: ["id", "title", "currentPrice", "status", "endTime"]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      bids
    });
  } catch (error) {
    console.error("Get user penny bids error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Configure auto-bidding for a penny auction
// @route POST /api/penny-bids/:pennyAuctionId/auto-bid
exports.configureAutoBid = async (req, res) => {
  try {
    const { pennyAuctionId } = req.params;
    const { maxBids, stopWhenOutbid, bidDelaySec } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!maxBids || maxBids < 1) {
      return res.status(400).json({ message: "Please provide a valid maximum number of bids" });
    }
    
    // Find the penny auction
    const pennyAuction = await PennyAuction.findByPk(pennyAuctionId);
    
    if (!pennyAuction) {
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Check if auction is active
    if (pennyAuction.status !== 'active') {
      return res.status(400).json({ message: "Penny auction is not active" });
    }
    
    // Check if user is the seller
    if (pennyAuction.sellerId === userId) {
      return res.status(400).json({ message: "You cannot set up auto-bidding on your own penny auction" });
    }
    
    // Check if user already has an active auto-bid config for this auction
    let autoBidConfig = await AutoBidConfig.findOne({
      where: {
        pennyAuctionId,
        userId,
        isActive: true
      }
    });
    
    if (autoBidConfig) {
      // Update existing config
      autoBidConfig.maxBids = maxBids;
      autoBidConfig.stopWhenOutbid = stopWhenOutbid || false;
      autoBidConfig.bidDelaySec = bidDelaySec || null;
      await autoBidConfig.save();
    } else {
      // Create new config
      autoBidConfig = await AutoBidConfig.create({
        pennyAuctionId,
        userId,
        maxBids,
        stopWhenOutbid: stopWhenOutbid || false,
        bidDelaySec: bidDelaySec || null,
        isActive: true
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Auto-bidding configured successfully",
      autoBidConfig
    });
  } catch (error) {
    console.error("Configure auto-bid error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Stop auto-bidding for a penny auction
// @route DELETE /api/penny-bids/:pennyAuctionId/auto-bid
exports.stopAutoBid = async (req, res) => {
  try {
    const { pennyAuctionId } = req.params;
    const userId = req.user.id;
    
    // Find the auto-bid config
    const autoBidConfig = await AutoBidConfig.findOne({
      where: {
        pennyAuctionId,
        userId,
        isActive: true
      }
    });
    
    if (!autoBidConfig) {
      return res.status(404).json({ message: "Active auto-bidding configuration not found" });
    }
    
    // Deactivate the config
    autoBidConfig.isActive = false;
    await autoBidConfig.save();
    
    res.status(200).json({
      success: true,
      message: "Auto-bidding stopped successfully"
    });
  } catch (error) {
    console.error("Stop auto-bid error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get bid statistics for a penny auction
// @route GET /api/penny-bids/:pennyAuctionId/stats
exports.getPennyAuctionBidStats = async (req, res) => {
  try {
    const { pennyAuctionId } = req.params;
    
    // Check if penny auction exists
    const pennyAuction = await PennyAuction.findByPk(pennyAuctionId);
    
    if (!pennyAuction) {
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Get total bids
    const totalBids = await PennyBid.count({
      where: { pennyAuctionId }
    });
    
    // Get unique bidders count
    const uniqueBidders = await PennyBid.count({
      where: { pennyAuctionId },
      distinct: true,
      col: 'bidderId'
    });
    
    // Get top bidders
    const topBidders = await PennyBid.findAll({
      attributes: [
        'bidderId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'bidCount']
      ],
      where: { pennyAuctionId },
      include: [{ model: User, as: "bidder", attributes: ["name"] }],
      group: ['bidderId', 'bidder.id', 'bidder.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5
    });
    
    // Get bid activity over time (hourly)
    const bidActivity = await PennyBid.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'hour', sequelize.col('createdAt')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bidCount']
      ],
      where: { pennyAuctionId },
      group: [sequelize.fn('date_trunc', 'hour', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date_trunc', 'hour', sequelize.col('createdAt')), 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      stats: {
        totalBids,
        uniqueBidders,
        topBidders,
        bidActivity
      }
    });
  } catch (error) {
    console.error("Get penny auction bid stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};