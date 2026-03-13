const express = require("express");
const {
  companyRegister,
  updateMyProfile,
  getCompanyById,
  getCompanyOverview,
} = require("../controllers/companyController");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.put("/update-profile", authMiddleware, updateMyProfile);
router.get("/companies/:id", authMiddleware, getCompanyById);
router.get("/overview", authMiddleware, getCompanyOverview);

module.exports = router;
