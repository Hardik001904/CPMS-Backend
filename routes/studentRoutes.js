const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth");
const { updateStudentProfile, getStudentOverview } = require("../controllers/studentController");
const { changePassword, deleteAccount } = require("../controllers/companyController");


router.put("/profile", authMiddleware, roleCheck(["STUDENT"]), updateStudentProfile);
router.get("/overview", authMiddleware, roleCheck(["STUDENT"]), getStudentOverview);
router.patch("/change-password", authMiddleware, roleCheck(["STUDENT"]), changePassword);
router.delete("/account", authMiddleware, roleCheck(["STUDENT"]), deleteAccount);

module.exports = router;