const express = require("express");
const {
  companyRegister,
  updateMyProfile,
  getCompanyById,
  getCompanyOverview,
  changePassword,
  deleteAccount,
} = require("../controllers/companyController");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.put("/update-profile", authMiddleware, updateMyProfile);
router.get("/companies/:id", authMiddleware, getCompanyById);
router.get("/overview", authMiddleware, getCompanyOverview);
router.patch("/change-password", authMiddleware, changePassword);
router.delete("/account", authMiddleware, deleteAccount);

module.exports = router;
