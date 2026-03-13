const application = require("../models/application");
const Application = require("../models/application");
const Job = require("../models/job");

//Company: Update status (Shortlist/Reject/Select)

const updateApplicationStatus = async (req, res) => {
  try {
    // console.log("object");
    const { status } = req.body;
    // console.log("status");

    const allowedStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const app = await Application.findById(req.params.id);

    if (!app) return res.status(404).json({ message: "Application not found" });

    // Ensure the company owns this application
    if (app.companyId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    app.status = status;
    await app.save();

    res.status(200).json({
      message: "Application status updated successfully",
      application: app,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const applyToJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    const job = await Job.findById(jobId).populate("companyId");
    // console.log("job data", job);

    if (!job || job.status !== "Open") {
      return res.status(404).json({ message: "Job not found or closed" });
    }

    const existingApplication = await Application.findOne({
      studentId: userId,
      jobId: jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "Already applied to this job",
      });
    }

    const application = await Application.create({
      jobId: job._id,
      jobTitle: job.title,
      studentId: userId,
      studentName: req.user.name, // must be inside token
      companyId: job.companyId._id,
      companyName: job.companyName,
      status: "Applied",
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Apply Job Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Student: Get my own applications
const getStudentApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const application = await Application.find({ studentId: userId }).sort({
      appliedDate: -1,
    });
    // console.log(application);
    return res
      .status(200)
      .json({ message: "Get application successfully", application });
  } catch (error) {
    console.error("Get Application Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getCompanyApplication = async (req, res) => {
  try {
    const id = req.user.id;
    const application = await Application.find({ companyId: id }).sort({
      appliedDate: -1,
    });
    return res
      .status(200)
      .json({ message: "Get application successfully", application });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Helper: Check student eligibility for a job
const checkEligibility = (student, job) => {
  const studentCgpa = parseFloat(student.profile?.cgpa || 0);
  const minCgpa = parseFloat(job.minCgpa || 0);

  if (studentCgpa < minCgpa) return "Not Eligible";
  if (student.profile?.currentBacklog && !job.backlogAllowed)
    return "Backlog Found";

  //Branch check
  if (
    job.allowedBranches?.length > 0 &&
    !job.allowedBranches.includes(student.profile?.branch)
  ) {
    return "Not Eligible";
  }
  return "Eligible";
};

module.exports = {
  applyToJob,
  updateApplicationStatus,
  getStudentApplication,
  getCompanyApplication,
  checkEligibility,
};
