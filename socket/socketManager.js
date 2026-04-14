/**
 * socketManager.js
 *
 * Manages Socket.io connections with JWT authentication.
 * Users join their own room (userId) so targeted notifications
 * can be pushed instantly.
 *
 * Architecture:
 *   - Each authenticated user joins room: `user:{userId}`
 *   - Admins additionally join room: `role:ADMIN`
 *   - Notifications are emitted to rooms, not individual sockets
 *     (handles multiple tabs/devices automatically)
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

/**
 * Initialize Socket.io on an existing HTTP server.
 * Call this once in server.js after app.listen().
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    // cors: {
    //   origin: process.env.CLIENT_URL || "*",
    //   methods: ["GET", "POST"],
    //   credentials: true,
    // },
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Enable connection state recovery - client reconnects seamlessly
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // ── Authentication Middleware ──────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      // ADD THIS:
      console.log("[Socket] Auth attempt - token present:", !!token);

      if (!token) {
        console.log("[Socket] REJECTED - no token"); // ← ADD
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      // ADD THIS:
      console.log(
        `[Socket] Auth SUCCESS - userId: ${socket.userId}, role: ${socket.userRole}`,
      );

      next();
    } catch (err) {
       console.log("[Socket] REJECTED - invalid token:", err.message); // ← ADD
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ── Connection Handler ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const { userId, userRole } = socket;

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role room (useful for admin broadcasts)
    socket.join(`role:${userRole}`);

    console.log(`[Socket] Connected: ${userId} (${userRole}) - ${socket.id}`);

    // Client can explicitly mark notifications as read
    socket.on("notification:markRead", ({ notificationId }) => {
      // Handled via REST API; this is just for client acknowledgement
      console.log(`[Socket] Mark read: ${notificationId} by ${userId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${userId} - ${reason}`);
    });

    // Send connection acknowledgement
    socket.emit("connected", {
      message: "Real-time notifications active",
      userId,
      role: userRole,
    });
  });

  console.log("[Socket] Socket.io initialized");
  return io;
}

/**
 * Get the socket.io instance (throws if not initialized).
 */
function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
}

/**
 * Emit a notification to a specific user.
 * @param {String} userId      - Target user's MongoDB ObjectId string
 * @param {Object} notification - Notification document or plain object
 */
function emitToUser(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification:new", notification);
  console.log("notification:new User", notification);

}

/**
 * Emit a notification to all users of a specific role.
 * @param {String} role         - 'STUDENT' | 'COMPANY' | 'ADMIN'
 * @param {Object} notification - Notification document or plain object
 */
function emitToRole(role, notification) {
  if (!io) return;
  io.to(`role:${role}`).emit("notification:new", notification);
  console.log("notification:new Role", notification);
}

/**
 * Emit notifications to multiple users.
 * @param {Array}  userIds      - Array of user ID strings
 * @param {Object} notification - Notification template (without recipientId)
 */
function emitToMany(userIds, notification) {
  if (!io || !userIds.length) return;
  userIds.forEach((userId) => {
    io.to(`user:${userId}`).emit("notification:new", {
      ...notification,
      recipientId: userId,
    });
  });
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToMany,
};
