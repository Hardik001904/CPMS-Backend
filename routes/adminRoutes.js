const express = require("express");
const { getPendingApprovals, approveUser, rejectUser, getSystemStats, getAllStudents, getAllCompanies, getBinUsers, restoreUser, deletePermanently, getStudentById, getAdminDashboard } = require("../controllers/adminController");
const router = express.Router();

router.get("/approvals", getPendingApprovals);
router.patch("/approve/:id", approveUser);
router.patch("/reject/:id", rejectUser);
router.get("/bin", getBinUsers);
router.patch("/restore/:id", restoreUser);
router.delete("/delete/:id", deletePermanently);
router.get("/stats", getSystemStats);
router.get("/students", getAllStudents);
router.get("/students/:id", getStudentById);
router.get("/companies", getAllCompanies);
router.get("/overview", getAdminDashboard);

module.exports = router;