const express = require("express");
const router = express.Router();
const { getUser, updateMyProfile, deleteUser, getUserById, studentRegister, login, companyRegister, updateStudentProfile } = require("../controllers/authController");
const { authMiddleware, roleCheck } = require("../middleware/auth");


router.post("/register/student", studentRegister);
router.post("/register/company", companyRegister);
router.post('/login', login);
router.get("/get", getUser);
router.put("/update/:id", authMiddleware , updateMyProfile);
router.delete("/delete/:id",authMiddleware, deleteUser);
router.get("/getUser",authMiddleware, getUserById);

module.exports = router;

