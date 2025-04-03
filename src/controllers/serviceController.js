const { ServiceUsage, ServiceBilling, ServiceBillingItem, User } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Service rate constants (in USD per minute)
const SERVICE_RATES = {
  auction: 0.02,           // $0.02 per minute for auction listings
  premium_listing: 0.01,   // $0.01 per minute for premium product listings
  featured_product: 0.015, // $0.015 per minute for featured products
  marketplace: 0.005,      // $0.005 per minute for standard marketplace listings
};

// @desc Start service usage tracking
// @route POST /api/services/start
exports.startServiceUsage = async (req, res) => {
  try {
    const { serviceType, description, metadata } = req.body;
    const userId = req.user.id;
    
    // Validate service type
    if (!serviceType || !SERVICE_RATES[serviceType]) {
      return res.status(400).json({ message: "Invalid service type" });
    }
    
    // Get rate for the service
    const ratePerMinute = SERVICE_RATES[serviceType];
    
    // Create service usage record
    const serviceUsage = await ServiceUsage.create({
      userId,
      serviceType,
      startTime: new Date(),
      ratePerMinute,
      status: 'active',
      description,
      metadata
    });
    
    res.status(201).json({
      success: true,
      message: "Service usage tracking started",
      serviceUsage
    });
  } catch (error) {
    console.error("Start service usage error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Stop service usage tracking
// @route PUT /api/services/:id/stop
exports.stopServiceUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the service usage record
    const serviceUsage = await ServiceUsage.findOne({
      where: { id, userId, status: 'active' }
    });
    
    if (!serviceUsage) {
      return res.status(404).json({ message: "Active service usage not found" });
    }
    
    // Calculate duration and cost
    const endTime = new Date();
    const startTime = new Date(serviceUsage.startTime);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Round up to nearest minute
    const totalCost = durationMinutes * serviceUsage.ratePerMinute;
    
    // Update service usage record
    serviceUsage.endTime = endTime;
    serviceUsage.durationMinutes = durationMinutes;
    serviceUsage.totalCost = totalCost;
    serviceUsage.status = 'completed';
    await serviceUsage.save();
    
    res.json({
      success: true,
      message: "Service usage tracking stopped",
      serviceUsage
    });
  } catch (error) {
    console.error("Stop service usage error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's service usage history
// @route GET /api/services/usage
exports.getUserServiceUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, serviceType, startDate, endDate } = req.query;
    
    // Build where condition
    const whereCondition = { userId };
    
    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    }
    
    // Add service type filter if provided
    if (serviceType) {
      whereCondition.serviceType = serviceType;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      whereCondition.startTime = {};
      
      if (startDate) {
        whereCondition.startTime[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        whereCondition.startTime[Op.lte] = new Date(endDate);
      }
    }
    
    // Get service usage records
    const serviceUsages = await ServiceUsage.findAll({
      where: whereCondition,
      order: [['startTime', 'DESC']]
    });
    
    // Calculate total cost
    const totalCost = serviceUsages.reduce((sum, usage) => {
      return sum + (usage.totalCost || 0);
    }, 0);
    
    res.json({
      success: true,
      count: serviceUsages.length,
      totalCost,
      serviceUsages
    });
  } catch (error) {
    console.error("Get service usage error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Generate billing for completed service usage
// @route POST /api/services/billing/generate
exports.generateBilling = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { userId, billingPeriodStart, billingPeriodEnd, dueDate, notes } = req.body;
    
    // Validate required fields
    if (!userId || !billingPeriodStart || !billingPeriodEnd || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if billing period is valid
    const startDate = new Date(billingPeriodStart);
    const endDate = new Date(billingPeriodEnd);
    
    if (startDate >= endDate) {
      return res.status(400).json({ message: "Billing period end date must be after start date" });
    }
    
    // Find completed service usages that haven't been billed yet
    const serviceUsages = await ServiceUsage.findAll({
      where: {
        userId,
        status: 'completed',
        startTime: {
          [Op.between]: [startDate, endDate]
        }
      },
      transaction: t
    });
    
    if (serviceUsages.length === 0) {
      await t.rollback();
      return res.status(404).json({ message: "No unbilled service usage found for this period" });
    }
    
    // Calculate total amount
    const totalAmount = serviceUsages.reduce((sum, usage) => {
      return sum + (usage.totalCost || 0);
    }, 0);
    
    // Generate invoice number
    const invoiceNumber = `INV-${userId.substring(0, 8)}-${Date.now().toString().substring(0, 10)}`;
    
    // Create billing record
    const serviceBilling = await ServiceBilling.create({
      userId,
      billingPeriodStart: startDate,
      billingPeriodEnd: endDate,
      totalAmount,
      status: 'pending',
      dueDate: new Date(dueDate),
      invoiceNumber,
      notes
    }, { transaction: t });
    
    // Create billing items for each service usage
    await Promise.all(serviceUsages.map(async (usage) => {
      await ServiceBillingItem.create({
        serviceBillingId: serviceBilling.id,
        serviceUsageId: usage.id,
        amount: usage.totalCost || 0
      }, { transaction: t });
      
      // Update service usage status to 'billed'
      usage.status = 'billed';
      await usage.save({ transaction: t });
    }));
    
    await t.commit();
    
    res.status(201).json({
      success: true,
      message: "Billing generated successfully",
      serviceBilling
    });
  } catch (error) {
    await t.rollback();
    console.error("Generate billing error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's billing history
// @route GET /api/services/billing
exports.getUserBilling = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    // Build where condition
    const whereCondition = { userId };
    
    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    }
    
    // Get billing records
    const billings = await ServiceBilling.findAll({
      where: whereCondition,
      include: [{
        model: ServiceUsage,
        as: 'usages',
        through: { attributes: ['amount'] }
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: billings.length,
      billings
    });
  } catch (error) {
    console.error("Get billing error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get billing details by ID
// @route GET /api/services/billing/:id
exports.getBillingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the billing record
    const billing = await ServiceBilling.findOne({
      where: { id, userId },
      include: [{
        model: ServiceUsage,
        as: 'usages',
        through: { attributes: ['amount'] }
      }]
    });
    
    if (!billing) {
      return res.status(404).json({ message: "Billing not found" });
    }
    
    res.json({
      success: true,
      billing
    });
  } catch (error) {
    console.error("Get billing details error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update billing status (admin only)
// @route PUT /api/services/billing/:id
exports.updateBillingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, notes } = req.body;
    
    // Validate status
    if (!status || !['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Find the billing record
    const billing = await ServiceBilling.findByPk(id);
    
    if (!billing) {
      return res.status(404).json({ message: "Billing not found" });
    }
    
    // Update billing record
    billing.status = status;
    
    if (status === 'paid') {
      billing.paymentDate = new Date();
    }
    
    if (paymentMethod) {
      billing.paymentMethod = paymentMethod;
    }
    
    if (notes) {
      billing.notes = notes;
    }
    
    await billing.save();
    
    res.json({
      success: true,
      message: "Billing status updated",
      billing
    });
  } catch (error) {
    console.error("Update billing status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get service usage statistics
// @route GET /api/services/stats
exports.getServiceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    // Set default date range to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);
    
    // Get service usage by type
    const usageByType = await ServiceUsage.findAll({
      attributes: [
        'serviceType',
        [sequelize.fn('SUM', sequelize.col('durationMinutes')), 'totalMinutes'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalCost'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        userId,
        startTime: {
          [Op.between]: [start, end]
        }
      },
      group: ['serviceType']
    });
    
    // Get total usage
    const totalUsage = await ServiceUsage.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('durationMinutes')), 'totalMinutes'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalCost'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        userId,
        startTime: {
          [Op.between]: [start, end]
        }
      }
    });
    
    // Get daily usage
    const dailyUsage = await ServiceUsage.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('startTime')), 'date'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalCost']
      ],
      where: {
        userId,
        startTime: {
          [Op.between]: [start, end]
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('startTime'))],
      order: [[sequelize.fn('DATE', sequelize.col('startTime')), 'ASC']]
    });
    
    res.json({
      success: true,
      usageByType,
      totalUsage: totalUsage || { totalMinutes: 0, totalCost: 0, count: 0 },
      dailyUsage,
      dateRange: {
        start,
        end
      }
    });
  } catch (error) {
    console.error("Get service stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};