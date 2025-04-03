const { 
  BidPackage, 
  BidTransaction, 
  UserBidBalance 
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// @desc Create a new bid package (admin only)
// @route POST /api/bid-packages
exports.createBidPackage = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      bidCount, 
      price, 
      discountPercentage, 
      imageUrl,
      featured
    } = req.body;
    
    // Validate required fields
    if (!name || !bidCount || !price) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Create bid package
    const bidPackage = await BidPackage.create({
      name,
      description,
      bidCount: parseInt(bidCount),
      price: parseFloat(price),
      discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
      imageUrl,
      featured: featured || false
    });
    
    res.status(201).json({
      success: true,
      message: "Bid package created successfully",
      bidPackage
    });
  } catch (error) {
    console.error("Create bid package error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all bid packages
// @route GET /api/bid-packages
exports.getAllBidPackages = async (req, res) => {
  try {
    const { active } = req.query;
    
    // Build where condition
    const whereCondition = {};
    
    // Add active filter if provided
    if (active === 'true') {
      whereCondition.isActive = true;
    }
    
    // Get bid packages
    const bidPackages = await BidPackage.findAll({
      where: whereCondition,
      order: [
        ['featured', 'DESC'],
        ['price', 'ASC']
      ]
    });
    
    res.json({
      success: true,
      count: bidPackages.length,
      bidPackages
    });
  } catch (error) {
    console.error("Get bid packages error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get bid package by ID
// @route GET /api/bid-packages/:id
exports.getBidPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bidPackage = await BidPackage.findByPk(id);
    
    if (!bidPackage) {
      return res.status(404).json({ message: "Bid package not found" });
    }
    
    res.json({
      success: true,
      bidPackage
    });
  } catch (error) {
    console.error("Get bid package error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update bid package (admin only)
// @route PUT /api/bid-packages/:id
exports.updateBidPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      bidCount, 
      price, 
      isActive,
      discountPercentage, 
      imageUrl,
      featured
    } = req.body;
    
    const bidPackage = await BidPackage.findByPk(id);
    
    if (!bidPackage) {
      return res.status(404).json({ message: "Bid package not found" });
    }
    
    // Update fields
    if (name) bidPackage.name = name;
    if (description !== undefined) bidPackage.description = description;
    if (bidCount) bidPackage.bidCount = parseInt(bidCount);
    if (price) bidPackage.price = parseFloat(price);
    if (isActive !== undefined) bidPackage.isActive = isActive;
    if (discountPercentage !== undefined) bidPackage.discountPercentage = discountPercentage ? parseFloat(discountPercentage) : null;
    if (imageUrl) bidPackage.imageUrl = imageUrl;
    if (featured !== undefined) bidPackage.featured = featured;
    
    await bidPackage.save();
    
    res.json({
      success: true,
      message: "Bid package updated successfully",
      bidPackage
    });
  } catch (error) {
    console.error("Update bid package error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete bid package (admin only)
// @route DELETE /api/bid-packages/:id
exports.deleteBidPackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bidPackage = await BidPackage.findByPk(id);
    
    if (!bidPackage) {
      return res.status(404).json({ message: "Bid package not found" });
    }
    
    // Instead of deleting, just deactivate
    bidPackage.isActive = false;
    await bidPackage.save();
    
    res.json({
      success: true,
      message: "Bid package deactivated successfully"
    });
  } catch (error) {
    console.error("Delete bid package error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Purchase a bid package
// @route POST /api/bid-packages/:id/purchase
exports.purchaseBidPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const bidPackage = await BidPackage.findByPk(id);
    
    if (!bidPackage) {
      return res.status(404).json({ message: "Bid package not found" });
    }
    
    if (!bidPackage.isActive) {
      return res.status(400).json({ message: "This bid package is no longer available" });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bidPackage.name,
              description: `${bidPackage.bidCount} bids for penny auctions`,
              images: bidPackage.imageUrl ? [bidPackage.imageUrl] : [],
            },
            unit_amount: Math.round(bidPackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/bid-packages/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/bid-packages/cancel`,
      metadata: {
        bidPackageId: bidPackage.id,
        userId,
        bidCount: bidPackage.bidCount
      }
    });
    
    // Create a pending transaction
    await BidTransaction.create({
      userId,
      bidPackageId: bidPackage.id,
      transactionType: 'purchase',
      bidCount: bidPackage.bidCount,
      amount: bidPackage.price,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      stripeSessionId: session.id,
      description: `Purchase of ${bidPackage.name} (${bidPackage.bidCount} bids)`
    });
    
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error("Purchase bid package error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Handle Stripe webhook for bid package purchase
// @route POST /api/bid-packages/webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Fulfill the purchase
    try {
      await fulfillBidPackagePurchase(session);
    } catch (error) {
      console.error("Error fulfilling bid package purchase:", error);
      return res.status(500).send(`Error fulfilling purchase: ${error.message}`);
    }
  }
  
  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};

// Helper function to fulfill bid package purchase
async function fulfillBidPackagePurchase(session) {
  const t = await sequelize.transaction();
  
  try {
    // Find the transaction
    const transaction = await BidTransaction.findOne({
      where: { stripeSessionId: session.id },
      transaction: t
    });
    
    if (!transaction) {
      await t.rollback();
      throw new Error("Transaction not found");
    }
    
    // Update transaction status
    transaction.paymentStatus = 'completed';
    await transaction.save({ transaction: t });
    
    // Get or create user bid balance
    let userBidBalance = await UserBidBalance.findOne({
      where: { userId: transaction.userId },
      transaction: t
    });
    
    if (!userBidBalance) {
      userBidBalance = await UserBidBalance.create({
        userId: transaction.userId,
        bidBalance: 0,
        totalBidsPurchased: 0,
        totalBidsUsed: 0
      }, { transaction: t });
    }
    
    // Update user bid balance
    userBidBalance.bidBalance += transaction.bidCount;
    userBidBalance.totalBidsPurchased += transaction.bidCount;
    userBidBalance.lastPurchaseDate = new Date();
    await userBidBalance.save({ transaction: t });
    
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

// @desc Get user's bid balance
// @route GET /api/bid-packages/balance
exports.getUserBidBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user bid balance
    let userBidBalance = await UserBidBalance.findOne({
      where: { userId }
    });
    
    // Create bid balance if it doesn't exist
    if (!userBidBalance) {
      userBidBalance = await UserBidBalance.create({
        userId,
        bidBalance: 0,
        totalBidsPurchased: 0,
        totalBidsUsed: 0
      });
    }
    
    // Get recent transactions
    const recentTransactions = await BidTransaction.findAll({
      where: { 
        userId,
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: [
        { model: BidPackage, as: "bidPackage", required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      bidBalance: userBidBalance,
      recentTransactions
    });
  } catch (error) {
    console.error("Get user bid balance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's bid transaction history
// @route GET /api/bid-packages/transactions
exports.getUserBidTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Build where condition
    const whereCondition = { userId };
    
    // Add transaction type filter if provided
    if (type) {
      whereCondition.transactionType = type;
    }
    
    // Get transactions
    const { count, rows: transactions } = await BidTransaction.findAndCountAll({
      where: whereCondition,
      include: [
        { model: BidPackage, as: "bidPackage", required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      transactions
    });
  } catch (error) {
    console.error("Get user bid transactions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Add free bids to user (admin only)
// @route POST /api/bid-packages/add-free-bids
exports.addFreeBids = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { userId, bidCount, reason } = req.body;
    
    // Validate required fields
    if (!userId || !bidCount || bidCount < 1) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Get user bid balance
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
    
    // Update user bid balance
    userBidBalance.bidBalance += parseInt(bidCount);
    userBidBalance.totalBidsPurchased += parseInt(bidCount);
    await userBidBalance.save({ transaction: t });
    
    // Create transaction record
    await BidTransaction.create({
      userId,
      transactionType: 'bonus',
      bidCount: parseInt(bidCount),
      paymentStatus: 'completed',
      description: reason || 'Free bids added by admin'
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: `${bidCount} free bids added successfully`,
      userBidBalance
    });
  } catch (error) {
    await t.rollback();
    console.error("Add free bids error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};