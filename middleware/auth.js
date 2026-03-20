const jwt = require("jsonwebtoken");
const User = require("../models/user");
const INACTIVE_LIMIT = 15 * 60 * 1000; // 15 min
const authMiddleware = async(req, res, next) => {
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

    const session = user.sessions.find(s => s.token === token);

    if (!session) {
      return res.status(401).json({ message: "Session not found" });
    }

    //  Check inactivity
    const now = new Date();
    const diff = now - session.lastActive;

    if (diff > INACTIVE_LIMIT) {
      //  remove session
      user.sessions = user.sessions.filter(s => s.token !== token);
      await user.save();

      return res.status(401).json({
        message: "Session expired due to inactivity",
      });
    }

    //  update last active time
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
