/**
 * notificationController.js
 *
 * REST API for notification CRUD operations.
 * Real-time delivery is handled by Socket.io separately.
 */

const Notification = require("../models/notification");

/**
 * GET /api/notifications
 * Fetch paginated notifications for the authenticated user.
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === "true";

    const filter = { recipientId: userId };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Fast endpoint just for the badge counter.
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark ALL notifications as read for the authenticated user.
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification.
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user.id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * DELETE /api/notifications/clear-all
 * Delete all read notifications for the user (cleanup).
 */
const clearAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipientId: req.user.id,
      isRead: true,
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} read notifications`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
};