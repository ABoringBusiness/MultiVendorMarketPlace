const { 
  PennyAuction, 
  PennyBid, 
  User, 
  Category, 
  UserBidBalance, 
  BidTransaction,
  AutoBidConfig
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// @desc Create a new penny auction
// @route POST /api/penny-auctions
exports.createPennyAuction = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      title, 
      description, 
      categoryId, 
      retailPrice, 
      startingPrice, 
      bidIncrement, 
      bidCost, 
      startTime, 
      timerSeconds,
      imageUrl,
      featured
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !categoryId || !retailPrice || !startTime) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Validate category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    // Validate time constraints
    const parsedStartTime = new Date(startTime);
    
    if (parsedStartTime < new Date()) {
      return res.status(400).json({ message: "Auction starting time must be in the future" });
    }
    
    // Check if seller already has 5 active penny auctions
    const activeAuctionsCount = await PennyAuction.count({
      where: {
        sellerId: req.user.id,
        status: { [Op.in]: ['pending', 'active'] }
      }
    });
    
    if (activeAuctionsCount >= 5) {
      return res.status(400).json({ message: "You can only have up to 5 active penny auctions" });
    }
    
    // Create penny auction
    const pennyAuction = await PennyAuction.create({
      title,
      description,
      categoryId,
      retailPrice: parseFloat(retailPrice),
      startingPrice: startingPrice ? parseFloat(startingPrice) : 0,
      currentPrice: startingPrice ? parseFloat(startingPrice) : 0,
      bidIncrement: bidIncrement ? parseFloat(bidIncrement) : 0.01,
      bidCost: bidCost ? parseFloat(bidCost) : 0.50,
      startTime: parsedStartTime,
      timerSeconds: timerSeconds || 10,
      imageUrl,
      sellerId: req.user.id,
      status: parsedStartTime <= new Date() ? 'active' : 'pending',
      featured: featured || false
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      success: true,
      message: `Penny auction created successfully and will be active from ${startTime}`,
      pennyAuction
    });
  } catch (error) {
    await t.rollback();
    console.error("Create penny auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all penny auctions with optional filters
// @route GET /api/penny-auctions
exports.getAllPennyAuctions = async (req, res) => {
  try {
    const { categoryId, status, featured, search, minPrice, maxPrice } = req.query;
    
    // Build where condition
    const whereCondition = {
      isDisabled: false
    };
    
    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    } else {
      // Default to active auctions
      whereCondition.status = 'active';
    }
    
    // Add category filter if provided
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    // Add featured filter if provided
    if (featured === 'true') {
      whereCondition.featured = true;
    }
    
    // Add price range filters
    if (minPrice || maxPrice) {
      whereCondition.currentPrice = {};
      
      if (minPrice) {
        whereCondition.currentPrice[Op.gte] = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        whereCondition.currentPrice[Op.lte] = parseFloat(maxPrice);
      }
    }
    
    // Add search filter
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get penny auctions with related data
    const pennyAuctions = await PennyAuction.findAll({
      where: whereCondition,
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false }
      ],
      order: [
        ['featured', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      count: pennyAuctions.length,
      pennyAuctions
    });
  } catch (error) {
    console.error("Get penny auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get penny auction details by ID
// @route GET /api/penny-auctions/:id
exports.getPennyAuctionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pennyAuction = await PennyAuction.findByPk(id, {
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false },
        { 
          model: PennyBid, 
          as: "bids",
          include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });
    
    if (!pennyAuction || pennyAuction.isDisabled) {
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Get bid count for the current user if authenticated
    let userBidCount = 0;
    let userAutoBidConfig = null;
    
    if (req.user) {
      userBidCount = await PennyBid.count({
        where: {
          pennyAuctionId: id,
          bidderId: req.user.id
        }
      });
      
      userAutoBidConfig = await AutoBidConfig.findOne({
        where: {
          pennyAuctionId: id,
          userId: req.user.id,
          isActive: true
        }
      });
    }
    
    res.json({
      success: true,
      pennyAuction,
      userBidCount,
      userAutoBidConfig
    });
  } catch (error) {
    console.error("Get penny auction details error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get seller's penny auctions
// @route GET /api/penny-auctions/seller
exports.getSellerPennyAuctions = async (req, res) => {
  try {
    const pennyAuctions = await PennyAuction.findAll({
      where: { sellerId: req.user.id },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: pennyAuctions.length,
      pennyAuctions
    });
  } catch (error) {
    console.error("Get seller penny auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update penny auction details (seller only)
// @route PUT /api/penny-auctions/:id
exports.updatePennyAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      categoryId, 
      imageUrl, 
      retailPrice,
      startingPrice,
      bidIncrement,
      bidCost,
      startTime,
      timerSeconds,
      featured
    } = req.body;
    
    const pennyAuction = await PennyAuction.findByPk(id);
    
    if (!pennyAuction) {
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Check if user is the seller
    if (pennyAuction.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You are not authorized to update this penny auction" });
    }
    
    // Check if auction has already started
    if (pennyAuction.status !== 'pending') {
      return res.status(400).json({ message: "Cannot update penny auction after it has started" });
    }
    
    // Update auction fields
    if (title) pennyAuction.title = title;
    if (description) pennyAuction.description = description;
    if (imageUrl) pennyAuction.imageUrl = imageUrl;
    if (retailPrice) pennyAuction.retailPrice = parseFloat(retailPrice);
    if (startingPrice) {
      pennyAuction.startingPrice = parseFloat(startingPrice);
      pennyAuction.currentPrice = parseFloat(startingPrice);
    }
    if (bidIncrement) pennyAuction.bidIncrement = parseFloat(bidIncrement);
    if (bidCost) pennyAuction.bidCost = parseFloat(bidCost);
    if (timerSeconds) pennyAuction.timerSeconds = parseInt(timerSeconds);
    
    // Only admin can update featured status
    if (req.user.role === 'admin' && featured !== undefined) {
      pennyAuction.featured = featured;
    }
    
    // Validate category if provided
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      pennyAuction.categoryId = categoryId;
    }
    
    // Update start time if provided
    if (startTime) {
      const parsedStartTime = new Date(startTime);
      
      if (parsedStartTime < new Date()) {
        return res.status(400).json({ message: "Auction starting time must be in the future" });
      }
      
      pennyAuction.startTime = parsedStartTime;
    }
    
    await pennyAuction.save();
    
    res.json({
      success: true,
      message: "Penny auction updated successfully",
      pennyAuction
    });
  } catch (error) {
    console.error("Update penny auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Cancel penny auction (seller only, if no bids)
// @route DELETE /api/penny-auctions/:id
exports.cancelPennyAuction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pennyAuction = await PennyAuction.findByPk(id, {
      include: [{ model: PennyBid, as: "bids" }]
    });
    
    if (!pennyAuction) {
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Check if user is the seller or admin
    if (pennyAuction.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You are not authorized to cancel this penny auction" });
    }
    
    // Check if auction has bids
    if (pennyAuction.bids && pennyAuction.bids.length > 0 && req.user.role !== 'admin') {
      return res.status(400).json({ message: "Cannot cancel penny auction with existing bids" });
    }
    
    // Update auction status to cancelled
    pennyAuction.status = 'cancelled';
    await pennyAuction.save();
    
    res.json({
      success: true,
      message: "Penny auction cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel penny auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get penny auctions won by the current user
// @route GET /api/penny-auctions/won
exports.getWonPennyAuctions = async (req, res) => {
  try {
    const pennyAuctions = await PennyAuction.findAll({
      where: { 
        highestBidderId: req.user.id,
        status: 'completed'
      },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] }
      ],
      order: [['endTime', 'DESC']]
    });
    
    res.json({
      success: true,
      count: pennyAuctions.length,
      pennyAuctions
    });
  } catch (error) {
    console.error("Get won penny auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get penny auctions the user has bid on
// @route GET /api/penny-auctions/bidding
exports.getBiddingPennyAuctions = async (req, res) => {
  try {
    // Find all penny bids by the user
    const userBids = await PennyBid.findAll({
      where: { bidderId: req.user.id },
      attributes: ['pennyAuctionId'],
      group: ['pennyAuctionId']
    });
    
    // Extract auction IDs
    const auctionIds = userBids.map(bid => bid.pennyAuctionId);
    
    // Get auctions
    const pennyAuctions = await PennyAuction.findAll({
      where: { 
        id: { [Op.in]: auctionIds },
        status: { [Op.in]: ['active', 'completed'] }
      },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false }
      ],
      order: [
        ['status', 'ASC'],
        ['endTime', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      count: pennyAuctions.length,
      pennyAuctions
    });
  } catch (error) {
    console.error("Get bidding penny auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Complete a penny auction (admin only)
// @route PUT /api/penny-auctions/:id/complete
exports.completePennyAuction = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const pennyAuction = await PennyAuction.findByPk(id, {
      include: [
        { model: User, as: "highestBidder", required: false }
      ],
      transaction: t
    });
    
    if (!pennyAuction) {
      await t.rollback();
      return res.status(404).json({ message: "Penny auction not found" });
    }
    
    // Check if auction is active
    if (pennyAuction.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ message: "Only active penny auctions can be completed" });
    }
    
    // Update auction status to completed
    pennyAuction.status = 'completed';
    pennyAuction.endTime = new Date();
    await pennyAuction.save({ transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: "Penny auction completed successfully",
      pennyAuction
    });
  } catch (error) {
    await t.rollback();
    console.error("Complete penny auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get penny auction statistics
// @route GET /api/penny-auctions/stats
exports.getPennyAuctionStats = async (req, res) => {
  try {
    // Get total active auctions
    const activeCount = await PennyAuction.count({
      where: { status: 'active' }
    });
    
    // Get total completed auctions
    const completedCount = await PennyAuction.count({
      where: { status: 'completed' }
    });
    
    // Get total bids placed
    const totalBids = await PennyBid.count();
    
    // Get auctions by category
    const auctionsByCategory = await PennyAuction.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [
        { model: Category, attributes: ["name"] }
      ],
      group: ['categoryId', 'Category.id', 'Category.name'],
      raw: true,
      nest: true
    });
    
    // Get most active auctions
    const mostActivePennyAuctions = await PennyAuction.findAll({
      attributes: [
        'id',
        'title',
        'currentPrice',
        'totalBids',
        'status'
      ],
      where: { status: 'active' },
      order: [['totalBids', 'DESC']],
      limit: 5
    });
    
    res.json({
      success: true,
      stats: {
        activeCount,
        completedCount,
        totalBids,
        auctionsByCategory,
        mostActivePennyAuctions
      }
    });
  } catch (error) {
    console.error("Get penny auction stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};