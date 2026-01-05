import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin } from "./_helpers/auth";
import { isValidNotificationType, sanitizeString } from "./_helpers/validators";
import { isExpired } from "./_helpers/utils";

/**
 * Notification Management Functions
 * 
 * Create, read, and manage user notifications.
 */

/**
 * Create a notification
 */
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    actionLink: v.optional(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Only authenticated users can create notifications
    // In practice, this would be called by the system or admin
    const user = await requireAuth(ctx);

    if (!isValidNotificationType(args.type)) {
      throw new Error("Invalid notification type");
    }

    const title = sanitizeString(args.title);
    const message = sanitizeString(args.message);

    if (!title || title.length < 2) {
      throw new Error("Title must be at least 2 characters long");
    }

    if (!message || message.length < 2) {
      throw new Error("Message must be at least 2 characters long");
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      title,
      message,
      type: args.type,
      isRead: false,
      actionLink: args.actionLink,
      metadata: args.metadata,
      expiresAt: args.expiresAt,
    });

    return {
      notificationId,
      message: "Notification created successfully",
    };
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // User can only mark their own notifications as read
    if (notification.userId !== user._id) {
      throw new Error("You can only mark your own notifications as read");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return {
      message: "Notification marked as read",
    };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return {
      message: `${notifications.length} notifications marked as read`,
    };
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // User can delete their own notifications, admin can delete any
    if (notification.userId !== user._id && user.role !== "admin") {
      throw new Error("You can only delete your own notifications");
    }

    await ctx.db.delete(args.notificationId);

    return {
      message: "Notification deleted successfully",
    };
  },
});

/**
 * Delete all read notifications
 */
export const deleteAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("isRead", true))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return {
      message: `${notifications.length} notifications deleted`,
    };
  },
});

/**
 * Get user's notifications
 */
export const getNotifications = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by read status
    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }

    // Filter by type
    if (args.type) {
      notifications = notifications.filter((n) => n.type === args.type);
    }

    // Filter out expired notifications
    notifications = notifications.filter((n) => {
      if (!n.expiresAt) return true;
      return !isExpired(n.expiresAt);
    });

    // Sort by creation time (newest first)
    notifications.sort((a, b) => b._creationTime - a._creationTime);

    return notifications;
  },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    // Filter out expired notifications
    const validNotifications = unreadNotifications.filter((n) => {
      if (!n.expiresAt) return true;
      return !isExpired(n.expiresAt);
    });

    return {
      count: validNotifications.length,
    };
  },
});

/**
 * Get notification by ID
 */
export const getNotificationById = query({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // User can only view their own notifications
    if (notification.userId !== user._id && user.role !== "admin") {
      throw new Error("You can only view your own notifications");
    }

    return notification;
  },
});

/**
 * Clean up expired notifications (admin only)
 */
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allNotifications = await ctx.db.query("notifications").collect();

    let deletedCount = 0;
    for (const notification of allNotifications) {
      if (notification.expiresAt && isExpired(notification.expiresAt)) {
        await ctx.db.delete(notification._id);
        deletedCount++;
      }
    }

    return {
      message: `${deletedCount} expired notifications deleted`,
    };
  },
});

/**
 * Send notification to multiple users (admin only)
 */
export const broadcastNotification = mutation({
  args: {
    userIds: v.array(v.id("users")),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    actionLink: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (!isValidNotificationType(args.type)) {
      throw new Error("Invalid notification type");
    }

    const title = sanitizeString(args.title);
    const message = sanitizeString(args.message);

    if (!title || title.length < 2) {
      throw new Error("Title must be at least 2 characters long");
    }

    if (!message || message.length < 2) {
      throw new Error("Message must be at least 2 characters long");
    }

    const notificationIds = [];

    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user) continue; // Skip invalid users

      const notificationId = await ctx.db.insert("notifications", {
        userId,
        title,
        message,
        type: args.type,
        isRead: false,
        actionLink: args.actionLink,
        expiresAt: args.expiresAt,
      });

      notificationIds.push(notificationId);
    }

    return {
      message: `${notificationIds.length} notifications sent`,
      notificationIds,
    };
  },
});
