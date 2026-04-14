const jwt = require("jsonwebtoken");
const User = require("../models/user");
const INACTIVE_LIMIT = 15 * 60 * 1000; // 15 min
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "No security token provided. Access denied." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "PLACEMENT_PRO_SECRET_KEY",
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const session = user.sessions.find((s) => s.token === token);

    if (!session) {
      // This token was kicked (takeover by another device) or logged out
      return res.status(401).json({
        message: "SESSION_ENDED",
        reason: "Your session was ended. Please log in again.",
      });
    }
    //  Check inactivity
    const now = new Date();
    const diff = now - session.lastActive;

    if (diff > INACTIVE_LIMIT) {
      //  remove session
      user.sessions = user.sessions.filter((s) => s.token !== token);
      await user.save();

      return res.status(401).json({
        message: "SESSION_INACTIVE",
        reason: "You were logged out due to 15 minutes of inactivity.",
      });
    }

    // Update lastActive on every authenticated request — this is the heartbeat.
    // Because of this, the frontend does NOT need to call /ping separately
    // as long as the user is actively making API calls. /ping exists only
    // for when the user is on a page that makes no API calls (e.g. read-only view).
    session.lastActive = now;
    await user.save();

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired session token." });
  }
};

const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Permission denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { authMiddleware, roleCheck };
