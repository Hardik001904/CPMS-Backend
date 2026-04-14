const express = require("express");
const { getSummaryStats } = require("../controllers/statsController");
const router = express.Router();

router.get("/summary", getSummaryStats);
// router.get("/top-companies", getTopCompanies);

module.exports = router;