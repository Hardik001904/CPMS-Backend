const express = require("express");
const { authMiddleware, roleCheck } = require("../middleware/auth");
const { postJob, getAllJobs, updateJobStatus, getMyJobs, updateJobRequirements, getJobById } = require("../controllers/jobController");
const router = express.Router();

// router.post("/create",authMiddleware, postJob);
router.get("/", authMiddleware, getAllJobs);
router.get("/:id/me", getJobById);
router.get("/company", authMiddleware, roleCheck(["COMPANY"]), getMyJobs);
router.post("/create", authMiddleware, roleCheck(["COMPANY"]), postJob);
router.patch("/:id/status", authMiddleware, roleCheck(["COMPANY"]), updateJobStatus);
router.patch("/:id/requirements", authMiddleware, roleCheck(["COMPANY"]), updateJobRequirements);


module.exports = router;
