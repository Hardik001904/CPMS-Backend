const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
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

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired session token." });
  }
};

const roleCheck = (roles) => {
  return (req, res, next) => {
    // console.log("in side role check : ", roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Permission denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { authMiddleware, roleCheck };
