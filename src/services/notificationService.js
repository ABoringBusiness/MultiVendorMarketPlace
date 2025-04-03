const { Notification, User } = require('../models');
const socketService = require('./socketService');
const { Op } = require('sequelize');

// Create a notification
const createNotification = async (userId, title, message, type, actionLink = null, metadata = null, expiresAt = null) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      actionLink,
      metadata,
      expiresAt,
      isRead: false
    });
    
    // Send real-time notification
    socketService.sendNotificationToUser(userId, {
      id: notification.id,
      title,
      message,
      type,
      actionLink,
      metadata,
      createdAt: notification.createdAt
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create notifications for multiple users
const createNotificationForUsers = async (userIds, title, message, type, actionLink = null, metadata = null, expiresAt = null) => {
  try {
    // Create notifications in database
    const notifications = await Promise.all(
      userIds.map(userId => 
        Notification.create({
          userId,
          title,
          message,
          type,
          actionLink,
          metadata,
          expiresAt,
          isRead: false
        })
      )
    );
    
    // Send real-time notifications
    userIds.forEach((userId, index) => {
      socketService.sendNotificationToUser(userId, {
        id: notifications[index].id,
        title,
        message,
        type,
        actionLink,
        metadata,
        createdAt: notifications[index].createdAt
      });
    });
    
    return notifications;
  } catch (error) {
    console.error('Error creating notifications for users:', error);
    throw error;
  }
};

// Create notification for all users with a specific role
const createNotificationForRole = async (role, title, message, type, actionLink = null, metadata = null, expiresAt = null) => {
  try {
    // Get all users with the specified role
    const users = await User.findAll({
      where: { role, isDisabled: false },
      attributes: ['id']
    });
    
    const userIds = users.map(user => user.id);
    
    // Create notifications in database
    const notifications = await Promise.all(
      userIds.map(userId => 
        Notification.create({
          userId,
          title,
          message,
          type,
          actionLink,
          metadata,
          expiresAt,
          isRead: false
        })
      )
    );
    
    // Send real-time notification to role
    socketService.sendNotificationToRole(role, {
      title,
      message,
      type,
      actionLink,
      metadata,
      createdAt: new Date()
    });
    
    return notifications;
  } catch (error) {
    console.error('Error creating notification for role:', error);
    throw error;
  }
};

// Get user's notifications
const getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
  try {
    const offset = (page - 1) * limit;
    
    // Build where condition
    const whereCondition = { userId };
    
    // Add unread filter if specified
    if (unreadOnly) {
      whereCondition.isRead = false;
    }
    
    // Add expiry filter
    whereCondition[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];
    
    // Get notifications
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return {
      notifications,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.isRead = true;
    await notification.save();
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (userId) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await notification.destroy();
    
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications
const deleteAllNotifications = async (userId) => {
  try {
    await Notification.destroy({
      where: { userId }
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.count({
      where: { 
        userId, 
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createNotificationForUsers,
  createNotificationForRole,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadNotificationCount
};