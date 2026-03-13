const Application = require("../models/application");
const Job = require("../models/job");
const User = require("../models/user");

//Get users awaiting verification
const getPendingApprovals = async (req, res) => {
  try {
    const pending = await User.find({ isApproved: false }).select("-password");
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Approve user access
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isApproved = true;
    await user.save();
    res.json({ message: `Access granted for ${user.name} ` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reject / Delete user
const rejectUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Account request rejected and purged" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get System-wide Analytics
const getSystemStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({
      role: "STUDENT",
      isApproved: true,
    });
    const totalCompanies = await User.countDocuments({
      role: "COMPANY",
      isApproved: true,
    });
    const activeJobs = await Job.countDocuments({ status: "Open" });
    const placedStudents = await Application.distinct("studentId", {
      status: "Selected",
    });

    res.json({
      students: totalStudents,
      companies: totalCompanies,
      jobs: activeJobs,
      placedCount: placedStudents.length,
      placementRate:
        totalStudents > 0 ? (placedStudents.length / totalStudents) * 100 : 0,
    });
  } catch (error) {
    res.status(500).json({ message: "error.message" });
  }
};

//Directory lists
const getAllStudents = async (req, res) => {
  try {
    const list = await User.find({ role: "STUDENT", isApproved: true }).select(
      "-password",
    );
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const list = await User.find({ role: "COMPANY", isApproved: true }).select(
      "-password",
    );
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getSystemStats,
  getAllStudents,
  getAllCompanies,
};
