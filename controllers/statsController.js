const User = require("../models/user");
const CollegeStudent = require("../models/collegeStudent");
const Application = require("../models/application");
const Job = require("../models/job");


let cachedStats = null;
let lastFetchTime = 0;

const CACHE_DURATION = 60 * 1000; // 60 seconds


const getSummaryStats = async (req, res) => {
  try {
    const currentTime = Date.now();

    //Return cached data if still valid
    if (cachedStats && currentTime - lastFetchTime < CACHE_DURATION) {
      return res.json(cachedStats);
    }

    // Fetch fresh data
    const totalStudents = await CollegeStudent.countDocuments();

    const totalCompanies = await User.countDocuments({
      role: "COMPANY",
    });

    const totalJobs = await Job.countDocuments();

    const placedStudentsList = await Application.distinct("studentId", {
      status: "Selected",
    });

    const placedStudents = placedStudentsList.length;

    const placementPercentage =
      totalStudents > 0
        ? ((placedStudents / totalStudents) * 100).toFixed(1)
        : 0;


    res.json({ totalStudents, totalCompanies, totalJobs, placedStudents,  placementPercentage, });

     // Save to cache
    // cachedStats = statsData;
    // lastFetchTime = currentTime;
    //  res.json(statsData);
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};




module.exports = { getSummaryStats };
