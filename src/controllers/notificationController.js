const notificationService = require('../services/notificationService');

// @desc Get user's notifications
// @route GET /api/notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await notificationService.getUserNotifications(
      userId, 
      page, 
      limit, 
      unreadOnly === 'true'
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get unread notification count
// @route GET /api/notifications/count
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await notificationService.getUnreadNotificationCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await notificationService.markNotificationAsRead(id, userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/read-all
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await notificationService.markAllNotificationsAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Delete notification
// @route DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await notificationService.deleteNotification(id, userId);
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Delete all notifications
// @route DELETE /api/notifications/delete-all
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await notificationService.deleteAllNotifications(userId);
    
    res.json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Send notification (admin only)
// @route POST /api/notifications/send
exports.sendNotification = async (req, res) => {
  try {
    const { userId, userIds, role, title, message, type, actionLink, metadata, expiresAt } = req.body;
    
    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({ message: 'Title, message, and type are required' });
    }
    
    // Validate recipient
    if (!userId && !userIds && !role) {
      return res.status(400).json({ message: 'At least one recipient (userId, userIds, or role) is required' });
    }
    
    let notifications;
    
    // Send to a single user
    if (userId) {
      notifications = await notificationService.createNotification(
        userId, title, message, type, actionLink, metadata, expiresAt
      );
    }
    // Send to multiple users
    else if (userIds && Array.isArray(userIds)) {
      notifications = await notificationService.createNotificationForUsers(
        userIds, title, message, type, actionLink, metadata, expiresAt
      );
    }
    // Send to a role
    else if (role) {
      notifications = await notificationService.createNotificationForRole(
        role, title, message, type, actionLink, metadata, expiresAt
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Notification(s) sent successfully',
      notifications
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};