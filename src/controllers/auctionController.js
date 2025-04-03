const { Auction, User, Category, Bid } = require("../models");
const { Op } = require("sequelize");

// @desc Create a new auction item
// @route POST /api/auctions
exports.createAuction = async (req, res) => {
  try {
    const { title, description, categoryId, condition, startingBid, startTime, endTime, imageUrl } = req.body;
    
    // Validate required fields
    if (!title || !description || !categoryId || !condition || !startingBid || !startTime || !endTime) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Validate category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    // Validate time constraints
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    
    if (parsedStartTime < new Date()) {
      return res.status(400).json({ message: "Auction starting time must be in the future" });
    }
    
    if (parsedStartTime >= parsedEndTime) {
      return res.status(400).json({ message: "Auction ending time must be after starting time" });
    }
    
    // Check if seller already has 3 active auctions
    const activeAuctionsCount = await Auction.count({
      where: {
        sellerId: req.user.id,
        endTime: { [Op.gt]: new Date() },
        status: { [Op.in]: ['pending', 'active'] }
      }
    });
    
    if (activeAuctionsCount >= 3) {
      return res.status(400).json({ message: "You can only have up to 3 active auctions" });
    }
    
    // Create auction
    const auction = await Auction.create({
      title,
      description,
      categoryId,
      condition,
      startingBid,
      currentBid: 0,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      imageUrl,
      sellerId: req.user.id,
      status: parsedStartTime <= new Date() ? 'active' : 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: `Auction created successfully and will be active from ${startTime}`,
      auction
    });
  } catch (error) {
    console.error("Create auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all active auctions with optional filters
// @route GET /api/auctions
exports.getAllAuctions = async (req, res) => {
  try {
    const { categoryId, sellerId, minPrice, maxPrice, search, status } = req.query;
    
    // Build where condition
    const whereCondition = {
      isDisabled: false
    };
    
    // Add status filter (default to active)
    whereCondition.status = status || 'active';
    
    // Add category filter if provided
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    // Add seller filter if provided
    if (sellerId) {
      whereCondition.sellerId = sellerId;
    }
    
    // Add price range filters
    if (minPrice || maxPrice) {
      whereCondition.startingBid = {};
      
      if (minPrice) {
        whereCondition.startingBid[Op.gte] = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        whereCondition.startingBid[Op.lte] = parseFloat(maxPrice);
      }
    }
    
    // Add search filter
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get auctions with related data
    const auctions = await Auction.findAll({
      where: whereCondition,
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: auctions.length,
      auctions
    });
  } catch (error) {
    console.error("Get auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get auction details by ID
// @route GET /api/auctions/:id
exports.getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const auction = await Auction.findByPk(id, {
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false },
        { 
          model: Bid, 
          as: "bids",
          include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
          order: [['amount', 'DESC']]
        }
      ]
    });
    
    if (!auction || auction.isDisabled) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    res.json({
      success: true,
      auction
    });
  } catch (error) {
    console.error("Get auction details error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get seller's auctions
// @route GET /api/auctions/seller
exports.getSellerAuctions = async (req, res) => {
  try {
    const auctions = await Auction.findAll({
      where: { sellerId: req.user.id },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: auctions.length,
      auctions
    });
  } catch (error) {
    console.error("Get seller auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update auction details (seller only)
// @route PUT /api/auctions/:id
exports.updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, condition, imageUrl } = req.body;
    
    const auction = await Auction.findByPk(id);
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Check if user is the seller
    if (auction.sellerId !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to update this auction" });
    }
    
    // Check if auction has already started
    if (auction.status !== 'pending') {
      return res.status(400).json({ message: "Cannot update auction after it has started" });
    }
    
    // Update auction fields
    if (title) auction.title = title;
    if (description) auction.description = description;
    if (condition) auction.condition = condition;
    if (imageUrl) auction.imageUrl = imageUrl;
    
    // Validate category if provided
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      auction.categoryId = categoryId;
    }
    
    await auction.save();
    
    res.json({
      success: true,
      message: "Auction updated successfully",
      auction
    });
  } catch (error) {
    console.error("Update auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Cancel auction (seller only, if no bids)
// @route DELETE /api/auctions/:id
exports.cancelAuction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const auction = await Auction.findByPk(id, {
      include: [{ model: Bid, as: "bids" }]
    });
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Check if user is the seller
    if (auction.sellerId !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to cancel this auction" });
    }
    
    // Check if auction has bids
    if (auction.bids && auction.bids.length > 0) {
      return res.status(400).json({ message: "Cannot cancel auction with existing bids" });
    }
    
    // Update auction status to cancelled
    auction.status = 'cancelled';
    await auction.save();
    
    res.json({
      success: true,
      message: "Auction cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Extend auction end time to prevent sniping
// @route POST /api/auctions/:id/extend
exports.extendAuctionEndTime = async (req, res) => {
  try {
    const { id } = req.params;
    
    const auction = await Auction.findByPk(id);
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Check if auction is active
    if (auction.status !== 'active') {
      return res.status(400).json({ message: "Can only extend active auctions" });
    }
    
    // Calculate time left
    const timeLeft = new Date(auction.endTime) - new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Only extend if less than 5 minutes remaining
    if (timeLeft <= fiveMinutes) {
      // Extend by 15 minutes
      const newEndTime = new Date(auction.endTime.getTime() + (15 * 60 * 1000));
      auction.endTime = newEndTime;
      await auction.save();
      
      return res.json({
        success: true,
        message: "Auction end time extended by 15 minutes",
        newEndTime: auction.endTime
      });
    } else {
      return res.json({
        success: true,
        message: "No extension needed",
        endTime: auction.endTime
      });
    }
  } catch (error) {
    console.error("Extend auction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get auctions won by the current user
// @route GET /api/auctions/won
exports.getWonAuctions = async (req, res) => {
  try {
    const auctions = await Auction.findAll({
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
      count: auctions.length,
      auctions
    });
  } catch (error) {
    console.error("Get won auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get auctions the user has bid on
// @route GET /api/auctions/bidding
exports.getBiddingAuctions = async (req, res) => {
  try {
    // Find all bids by the user
    const userBids = await Bid.findAll({
      where: { bidderId: req.user.id },
      attributes: ['auctionId'],
      group: ['auctionId']
    });
    
    // Extract auction IDs
    const auctionIds = userBids.map(bid => bid.auctionId);
    
    // Get auctions
    const auctions = await Auction.findAll({
      where: { 
        id: { [Op.in]: auctionIds },
        status: { [Op.in]: ['active', 'completed'] }
      },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, as: "seller", attributes: ["id", "name"] },
        { model: User, as: "highestBidder", attributes: ["id", "name"], required: false }
      ],
      order: [['endTime', 'DESC']]
    });
    
    res.json({
      success: true,
      count: auctions.length,
      auctions
    });
  } catch (error) {
    console.error("Get bidding auctions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};