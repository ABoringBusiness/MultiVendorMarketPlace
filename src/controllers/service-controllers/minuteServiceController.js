const { MinuteService, User, Category, ServiceSession } = require('../../models');
const { Op } = require('sequelize');

// @desc Create a new minute-based service
// @route POST /api/services/minute
exports.createMinuteService = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ratePerMinute, 
      minimumMinutes, 
      maximumMinutes, 
      maximumCharge, 
      categoryId, 
      tags 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !ratePerMinute || !categoryId) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Validate category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    // Create service
    const service = await MinuteService.create({
      title,
      description,
      ratePerMinute,
      minimumMinutes: minimumMinutes || 1,
      maximumMinutes: maximumMinutes || null,
      maximumCharge: maximumCharge || null,
      categoryId,
      providerId: req.user.id,
      tags: tags || []
    });
    
    res.status(201).json({
      success: true,
      message: "Minute-based service created successfully",
      service
    });
  } catch (error) {
    console.error("Create minute service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all minute-based services
// @route GET /api/services/minute
exports.getMinuteServices = async (req, res) => {
  try {
    const { category, minRate, maxRate, provider, search } = req.query;
    
    // Build query conditions
    const whereConditions = { isActive: true };
    
    if (category) {
      whereConditions.categoryId = category;
    }
    
    if (minRate) {
      whereConditions.ratePerMinute = { ...whereConditions.ratePerMinute, [Op.gte]: minRate };
    }
    
    if (maxRate) {
      whereConditions.ratePerMinute = { ...whereConditions.ratePerMinute, [Op.lte]: maxRate };
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }
    
    // Provider filter
    const includeConditions = [
      { model: User, as: 'provider', attributes: ['id', 'name', 'email', 'avatar'] }
    ];
    
    if (provider) {
      includeConditions[0].where = { id: provider };
    }
    
    // Get services
    const services = await MinuteService.findAll({
      where: whereConditions,
      include: includeConditions,
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error("Get minute services error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get a single minute-based service
// @route GET /api/services/minute/:id
exports.getMinuteService = async (req, res) => {
  try {
    const service = await MinuteService.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        { model: User, as: 'provider', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });
    
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    console.error("Get minute service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update a minute-based service
// @route PUT /api/services/minute/:id
exports.updateMinuteService = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ratePerMinute, 
      minimumMinutes, 
      maximumMinutes, 
      maximumCharge, 
      categoryId, 
      isActive, 
      tags 
    } = req.body;
    
    // Find service
    const service = await MinuteService.findOne({
      where: { id: req.params.id, providerId: req.user.id }
    });
    
    if (!service) {
      return res.status(404).json({ message: "Service not found or you don't have permission to update it" });
    }
    
    // Update service
    if (title) service.title = title;
    if (description) service.description = description;
    if (ratePerMinute) service.ratePerMinute = ratePerMinute;
    if (minimumMinutes) service.minimumMinutes = minimumMinutes;
    if (maximumMinutes !== undefined) service.maximumMinutes = maximumMinutes;
    if (maximumCharge !== undefined) service.maximumCharge = maximumCharge;
    if (categoryId) {
      // Validate category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      service.categoryId = categoryId;
    }
    if (isActive !== undefined) service.isActive = isActive;
    if (tags) service.tags = tags;
    
    await service.save();
    
    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service
    });
  } catch (error) {
    console.error("Update minute service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete a minute-based service
// @route DELETE /api/services/minute/:id
exports.deleteMinuteService = async (req, res) => {
  try {
    // Find service
    const service = await MinuteService.findOne({
      where: { id: req.params.id, providerId: req.user.id }
    });
    
    if (!service) {
      return res.status(404).json({ message: "Service not found or you don't have permission to delete it" });
    }
    
    // Check if service has active sessions
    const activeSessions = await ServiceSession.count({
      where: {
        serviceId: req.params.id,
        status: 'active'
      }
    });
    
    if (activeSessions > 0) {
      return res.status(400).json({ message: "Cannot delete service with active sessions" });
    }
    
    // Soft delete by setting isActive to false
    service.isActive = false;
    await service.save();
    
    res.status(200).json({
      success: true,
      message: "Service deleted successfully"
    });
  } catch (error) {
    console.error("Delete minute service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Start a service session
// @route POST /api/services/minute/:id/start
exports.startServiceSession = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    
    // Validate service exists and is active
    const service = await MinuteService.findOne({
      where: { id: serviceId, isActive: true },
      include: [{ model: User, as: 'provider' }]
    });
    
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    // Check if user already has an active session for this service
    const activeSession = await ServiceSession.findOne({
      where: {
        serviceId,
        userId,
        status: 'active'
      }
    });
    
    if (activeSession) {
      return res.status(400).json({ 
        message: "You already have an active session for this service",
        sessionId: activeSession.id
      });
    }
    
    // Create new session
    const session = await ServiceSession.create({
      serviceId,
      userId,
      providerId: service.providerId,
      startTime: new Date(),
      status: 'active'
    });
    
    // Notify provider
    // In a real implementation, this would use WebSockets or similar
    console.log(`Notifying provider ${service.providerId} of new session ${session.id}`);
    
    res.status(201).json({
      success: true,
      message: "Service session started",
      session,
      service: {
        title: service.title,
        ratePerMinute: service.ratePerMinute,
        minimumMinutes: service.minimumMinutes,
        maximumMinutes: service.maximumMinutes,
        maximumCharge: service.maximumCharge,
        provider: {
          id: service.provider.id,
          name: service.provider.name
        }
      }
    });
  } catch (error) {
    console.error("Start service session error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Stop a service session
// @route PUT /api/services/sessions/:id/stop
exports.stopServiceSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    
    // Find the session
    const session = await ServiceSession.findOne({
      where: {
        id: sessionId,
        [Op.or]: [
          { userId },
          { providerId: userId }
        ],
        status: 'active'
      },
      include: [{ model: MinuteService, as: 'service' }]
    });
    
    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }
    
    // Update session
    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    
    // Apply minimum charge if applicable
    const effectiveMinutes = Math.max(
      durationMinutes, 
      session.service.minimumMinutes || 0
    );
    
    // Apply maximum cap if applicable
    const ratePerMinute = session.service.ratePerMinute;
    let amount = effectiveMinutes * ratePerMinute;
    
    if (session.service.maximumCharge && amount > session.service.maximumCharge) {
      amount = session.service.maximumCharge;
    }
    
    // Update session
    session.endTime = endTime;
    session.durationMinutes = durationMinutes;
    session.amount = amount;
    session.status = 'completed';
    await session.save();
    
    // In a real implementation, this would use WebSockets or similar
    console.log(`Notifying user ${session.userId} and provider ${session.providerId} of completed session ${session.id}`);
    
    res.status(200).json({
      success: true,
      message: "Service session stopped",
      session: {
        id: session.id,
        serviceId: session.serviceId,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        amount: session.amount,
        status: session.status
      },
      paymentRequired: true,
      paymentAmount: amount
    });
  } catch (error) {
    console.error("Stop service session error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's active sessions
// @route GET /api/services/sessions/active
exports.getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find active sessions
    const sessions = await ServiceSession.findAll({
      where: {
        [Op.or]: [
          { userId },
          { providerId: userId }
        ],
        status: 'active'
      },
      include: [
        { model: MinuteService, as: 'service' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'provider', attributes: ['id', 'name', 'email', 'avatar'] }
      ],
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user's session history
// @route GET /api/services/sessions/history
exports.getSessionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0, status } = req.query;
    
    // Build query conditions
    const whereConditions = {
      [Op.or]: [
        { userId },
        { providerId: userId }
      ]
    };
    
    if (status) {
      whereConditions.status = status;
    } else {
      whereConditions.status = { [Op.ne]: 'active' };
    }
    
    // Find sessions
    const sessions = await ServiceSession.findAndCountAll({
      where: whereConditions,
      include: [
        { model: MinuteService, as: 'service' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'provider', attributes: ['id', 'name', 'email', 'avatar'] }
      ],
      order: [['endTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      success: true,
      count: sessions.count,
      sessions: sessions.rows
    });
  } catch (error) {
    console.error("Get session history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};