const Application = require("../models/application");
const Job = require("../models/job");
const User = require("../models/user");

const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { cgpa, skills, resumeUrl, phone, backlogCount, currentBacklog } =
      req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (user.role !== "STUDENT") {
      return res
        .status(403)
        .json({ message: "Only students can update profile" });
    }

    //Update only these 4 fields
    if (cgpa !== undefined) user.profile.cgpa = cgpa;
    if (skills !== undefined) user.profile.skills = skills;
    if (resumeUrl !== undefined) user.profile.resumeUrl = resumeUrl;
    if (phone !== undefined) user.profile.phone = phone;
    if (backlogCount !== undefined) user.profile.backlogCount = backlogCount;
    if (currentBacklog !== undefined)
      user.profile.currentBacklog = currentBacklog;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedFields: {
        cgpa: user.profile.cgpa,
        skills: user.profile.skills,
        resumeUrl: user.profile.resumeUrl,
        phone: user.profile.phone,
        backlogCount: user.profile.backlogCount,
        currentBacklog: user.profile.currentBacklog,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed:" + error.message });
  }
};

const getStudentOverview = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Applications count
    const applicationsInReview = await Application.countDocuments({
      studentId,
      status: "Applied",
    });

    const shortlists = await Application.countDocuments({
      studentId,
      status: "Shortlisted",
    });

    //Total active jobs
    const opportunities = await Job.countDocuments({
      status: "Open",
    });

    //Placement readiness calculation
    const profile = student.profile || {};
    let readiness = 0;

    if (profile.cgpa) readiness += 20;
    if (profile.skills && profile.skills.length > 0) readiness += 20;
    if (profile.resumeUrl) readiness += 20;
    if (profile.phone) readiness += 20;
    if (profile.enrollmentNumber) readiness += 20;

    // console.log("readiness", applicationsInReview);

    res.status(200).json({
      success: true,
      data: {
        name: student.name,
        campusId: profile.enrollmentNumber,
        placementReadiness: readiness,
        applicationsInReview,
        shortlists,
        opportunities,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { updateStudentProfile, getStudentOverview };
