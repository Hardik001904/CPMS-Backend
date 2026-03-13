const express = require("express");
const router = express.Router();
const {
  applyToJob,
  getStudentApplication,
  getCompanyApplication,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const { authMiddleware, roleCheck } = require("../middleware/auth");

// Student routes

router.post("/apply", authMiddleware, roleCheck(["STUDENT"]), applyToJob);
router.get(
  "/student",
  authMiddleware,
  roleCheck(["STUDENT"]),
  getStudentApplication,
);

//Company routes
router.get(
  "/company",
  authMiddleware,
  roleCheck(["COMPANY"]),
  getCompanyApplication,
);

router.patch("/:id/status", authMiddleware, roleCheck(["COMPANY"]), updateApplicationStatus);

// router.get("/student/:studentId", authMiddleware, roleCheck(["COMPANY"]), getStuden)

module.exports = router;
