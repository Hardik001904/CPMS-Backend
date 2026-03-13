const express = require("express");
const { authMiddleware, roleCheck } = require("../middleware/auth");
const { postJob, getAllJobs, updateJobStatus, getMyJobs } = require("../controllers/jobController");
const router = express.Router();

// router.post("/create",authMiddleware, postJob);
router.post("/create", authMiddleware, roleCheck(["COMPANY"]), postJob);
router.get("/", authMiddleware, getAllJobs);
router.get("/company", authMiddleware, roleCheck(["COMPANY"]), getMyJobs);
router.patch("/:id/status", authMiddleware, roleCheck(["COMPANY"]), updateJobStatus);




module.exports = router;
