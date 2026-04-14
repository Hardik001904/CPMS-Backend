const mongoose = require("mongoose");
const Application = require("../models/application");
const Job = require("../models/job");
const User = require("../models/user");
const CollageStudent = require("../models/collegeStudent");

//Get users awaiting verification
const getPendingApprovals = async (req, res) => {
  try {
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


// Permanently delete user (with transaction safety)
const deletePermanently = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.params.id;

    // 🔍 Find user inside transaction
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    // 🏢 If COMPANY → delete jobs + applications
    if (user.role === "COMPANY") {
      // 1️⃣ Get all jobs of company
      const jobs = await Job.find({ companyId: userId }).session(session);

      const jobIds = jobs.map((job) => job._id);

      // 2️⃣ Delete related applications
      if (jobIds.length > 0) {
        await Application.deleteMany({
          jobId: { $in: jobIds },
        }).session(session);
      }

      // 3️⃣ Delete jobs
      await Job.deleteMany({ companyId: userId }).session(session);
    }

    // 🧑‍💻 Delete user (for all roles)
    await User.findByIdAndDelete(userId).session(session);

    // ✅ Commit everything
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "User and related data deleted safely (transaction)",
    });

  } catch (error) {
    // ❌ Rollback everything if any error
    await session.abortTransaction();
    session.endSession();

    console.error("Delete Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user safely",
    });
  }
};
// Permanently delete user
// const deletePermanently = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.role === "COMPANY") {
//       const jobs = await Job.find({ companyId: userId });
//       const jobIds = jobs.map((job) => job._id);

//       await Application.deleteMany({ jobId: { $in: jobIds } });
//       await Job.deleteMany({ companyId: userId });
//     }

//     // delete user (for ALL roles)
//     await User.findByIdAndDelete(userId);

//     res.json({
//       message: "User and related data deleted successfully",
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// const deletePermanently = async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id);
//     res.json({ message: "User permanently deleted from database" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// Get System-wide Analytics
const getSystemStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'STUDENT', status: 'APPROVED' });

    const totalCompanies = await User.countDocuments({ role: 'COMPANY', status: 'APPROVED' });

    const activeJobs = await Job.countDocuments({ status: 'Open' });

    const placedStudents = await Application.distinct('studentId', { status: 'Selected' });

    // =========================
    // Company-wise placements
    const companyPlacements = await Application.aggregate([
      { $match: { status: "Selected" } },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job"
        }
      },
      { $unwind: "$job" },
      {
        $group: {
          _id: "$job.companyName", // make sure this exists
          placements: { $sum: 1 }
        }
      }
    ]);

    // =========================
    // Year-wise trends
    const yearlyTrends = await Application.aggregate([
      { $match: { status: "Selected" } },
      {
        $group: {
          _id: { $year: "$createdAt" },
          placements: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // =========================
    // 📅 Monthly placements
    const monthlyPlacements = await Application.aggregate([
      { $match: { status: "Selected" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          placements: { $sum: 1 }
        }
      }
    ]);

    // =========================
    res.json({
      students: totalStudents,
      companies: totalCompanies,
      jobs: activeJobs,
      placedCount: placedStudents.length,
      placementRate: totalStudents > 0
        ? (placedStudents.length / totalStudents) * 100
        : 0,

      companyPlacements,
      yearlyTrends,
      monthlyPlacements
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const getSystemStats = async (req, res) => {
//   try {
//     const totalStudents = await User.countDocuments({
//       role: "STUDENT",
//       isApproved: true,
//     });
//     const totalCompanies = await User.countDocuments({
//       role: "COMPANY",
//       isApproved: true,
//     });
//     const activeJobs = await Job.countDocuments({ status: "Open" });
//     const placedStudents = await Application.distinct("studentId", {
//       status: "Selected",
//     });

//     res.json({
//       students: totalStudents,
//       companies: totalCompanies,
//       jobs: activeJobs,
//       placedCount: placedStudents.length,
//       placementRate:
//         totalStudents > 0 ? (placedStudents.length / totalStudents) * 100 : 0,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "error.message" });
//   }
// };

//Directory lists
const getAllStudents = async (req, res) => {
  try {
    const list = await User.find({
      role: "STUDENT",
      status: "APPROVED",
    }).select("-password");
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
    const { search, industry } = req.query;

    let query = {
      role: "COMPANY",
      status: "APPROVED",
    };

    // Search by company name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Filter by industry
    if (industry && industry !== "All") {
      query["profile.industry"] = industry;
    }

    const list = await User.find(query).select("-password").sort({
      createdAt: -1,
    });

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

// Master Student List Management
const getMasterStudent = async (req, res) => {
  try {
    // console.log("getMasterStudent");
    const students = await CollageStudent.find().sort({ name: 1 });
    // console.log(students);
    res.json({ message: "getMasterStudent", students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const addMasterStudent = async (req, res) => {
  try {
    // const { name, enrollmentNumber, department } = req.body;
    const name = req.body.name.trim();
    const enrollmentNumber = req.body.enrollmentNumber.trim();
    const department = req.body.department.trim();
    if (!enrollmentNumber || !name || !department) {
      return res.status(400).json({
        message: "Enrollment number, name and department are required",
      });
    }

    const existing = await CollageStudent.findOne({ enrollmentNumber });

    if (existing) {
      return res.status(400).json({
        message: "Student with this enrollment number already exists",
      });
    }

    const newStudent = new CollageStudent({
      name,
      enrollmentNumber,
      department,
    });
    await newStudent.save();
    res.status(201).json({ newStudent });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

const deleteMasterStudent = async (req, res) => {
  try {
    await CollageStudent.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
  getMasterStudent,
  addMasterStudent,
  deleteMasterStudent,
};
