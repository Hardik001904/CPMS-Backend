const Application = require("../models/application");
const Job = require("../models/job");
const User = require("../models/user");

//Get users awaiting verification
const getPendingApprovals = async (req, res) => {
  try {
    // const pending = await User.find({ isApproved: false }).select("-password");
    const pending = await User.find({ status: "PENDING" }).select("-password");
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
    user.status = "APPROVED";
    await user.save();
    res.json({ message: `Access granted for ${user.name} ` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// // Reject / Delete user
// const rejectUser = async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id);
//     res.json({ message: "Account request rejected and purged" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// Reject user (Move to Bin)
const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "REJECTED";
    user.isApproved = false;
    await user.save();
    res.json({ message: "Account request moved to Bin" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Rejected users (Bin)
const getBinUsers = async (req, res) => {
  try {
    const bin = await User.find({ status: "REJECTED" }).select("-password");
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore user from Bin
const restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "PENDING";
    user.isApproved = false;
    await user.save();
    res.json({ message: `Account for ${user.name} restored to pending queue` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Permanently delete user
const deletePermanently = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User permanently deleted from database" });
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

const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
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

const getAdminDashboard = async (req, res) => {
  try {
    const company = await User.countDocuments({
      role: "COMPANY",
      status: "APPROVED",
    }).select("-password");

    const student = await User.countDocuments({
      role: "STUDENT",
      status: "APPROVED",
    }).select("-password");

    const pending = await User.countDocuments({
      role: "COMPANY",
      status: "PENDING",
    }).select("-password");

    const job = await Job.countDocuments();

    res.json({
      company,
      student,
      job,
      pending,
      message: "Admin Overview",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getBinUsers,
  restoreUser,
  deletePermanently,
  getSystemStats,
  getAllStudents,
  getAllCompanies,
  getStudentById,
  getAdminDashboard,
};
