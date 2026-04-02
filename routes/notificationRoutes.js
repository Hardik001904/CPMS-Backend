/**
 * notificationRoutes.js
 *
 * Mount at: app.use('/api/notifications', notificationRoutes)
 * All routes require authentication middleware.
 */

const express = require("express");
const router = express.Router();
// const { verifyToken } = require("../middleware/auth"); // your existing auth middleware
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/auth");

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications              - Paginated list
// GET /api/notifications?unread=true  - Unread only
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Fast badge count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/read-all - Mark all as read
router.patch("/read-all", markAllAsRead);

// DELETE /api/notifications/clear-all - Remove all read notifications
router.delete("/clear-all", clearAllRead);

// PATCH /api/notifications/:id/read - Mark single as read
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Delete single
router.delete("/:id", deleteNotification);

module.exports = router;