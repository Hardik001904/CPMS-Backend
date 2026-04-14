// const express = require("express");
// const router = express.Router();
// const { getUser, updateMyProfile, deleteUser, getUserById, studentRegister, login, companyRegister, updateStudentProfile, getMySessions, ping, logout, forceLogoutUser } = require("../controllers/authController");
// const { authMiddleware, roleCheck } = require("../middleware/auth");
// const { forgotPassword, resetPassword, verifyOtp } = require("../controllers/forgotpasswordController");


// router.get("/get", getUser);
// router.get("/getUser",authMiddleware, getUserById);
// router.get("/ping", authMiddleware, ping);
// router.get("/sessions", authMiddleware , getMySessions);

// router.post("/logout", authMiddleware, logout);    
// router.post("/register/student", studentRegister);
// router.post("/register/company", companyRegister);
// router.post('/login', login);
// router.post("/forgot-password", forgotPassword);
// router.post("/verify-otp", verifyOtp);
// router.post("/reset-password/:token", resetPassword);


// router.put("/update/:id", authMiddleware , updateMyProfile);

// router.delete("/delete/:id",authMiddleware, deleteUser);

// // ── Admin-only routes ──────────────────────────────────────────────────────
// router.delete(
//   "/admin/force-logout/:userId",
//   authMiddleware,
//   roleCheck(["ADMIN"]),
//   forceLogoutUser                                                    // ✅ was missing from routes
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  studentRegister,
  companyRegister,
  login,
  logout,
  getUser,
  updateMyProfile,
  deleteUser,
  getUserById,
  getMySessions,
  forceLogoutUser,
  ping,
} = require("../controllers/authController");

const { authMiddleware, roleCheck } = require("../middleware/auth");
const { forgotPassword, resetPassword, verifyOtp } = require("../controllers/forgotpasswordController");

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/register/student", studentRegister);
router.post("/register/company", companyRegister);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password/:token", resetPassword);

// ── Authenticated routes ───────────────────────────────────────────────────
router.get("/get", getUser);                                    // consider adding authMiddleware here too
router.get("/getUser", authMiddleware, getUserById);
router.get("/ping", authMiddleware, ping);
router.get("/sessions", authMiddleware, getMySessions);

router.post("/logout", authMiddleware, logout);

router.put("/update/:id", authMiddleware, updateMyProfile);
router.delete("/delete/:id", authMiddleware, deleteUser);

// ── Admin-only routes ──────────────────────────────────────────────────────
router.delete(
  "/admin/force-logout/:userId",
  authMiddleware,
  roleCheck(["ADMIN"]),
  forceLogoutUser
);

module.exports = router;

