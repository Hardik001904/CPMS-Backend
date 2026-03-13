const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth");
const { updateStudentProfile, getStudentOverview } = require("../controllers/studentController");


router.put("/profile", authMiddleware, roleCheck(["STUDENT"]), updateStudentProfile);
router.get("/overview", authMiddleware, roleCheck(["STUDENT"]), getStudentOverview);

module.exports = router;