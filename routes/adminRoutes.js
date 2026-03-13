const express = require("express");
const { getPendingApprovals, approveUser, rejectUser, getSystemStats, getAllStudents, getAllCompanies } = require("../controllers/adminController");
const router = express.Router();

router.get("/approvals", getPendingApprovals);
router.patch("/approve/:id", approveUser);
router.delete("/reject/:id", rejectUser);
router.get("/stats", getSystemStats);
router.get("/students", getAllStudents);
router.get("/companies", getAllCompanies);

module.exports = router;