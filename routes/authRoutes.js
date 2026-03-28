const express = require("express");
const router = express.Router();
const { getUser, updateMyProfile, deleteUser, getUserById, studentRegister, login, companyRegister, updateStudentProfile, getMySessions, ping } = require("../controllers/authController");
const { authMiddleware, roleCheck } = require("../middleware/auth");
const { forgotPassword, resetPassword } = require("../controllers/forgotpasswordcontroller");


router.get("/get", getUser);
router.get("/getUser",authMiddleware, getUserById);
router.get("/ping", authMiddleware, ping);
router.get("/sessions", authMiddleware , getMySessions);

router.post("/register/student", studentRegister);
router.post("/register/company", companyRegister);
router.post('/login', login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


router.put("/update/:id", authMiddleware , updateMyProfile);

router.delete("/delete/:id",authMiddleware, deleteUser);

module.exports = router;

