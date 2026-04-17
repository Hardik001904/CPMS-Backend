const Application = require("../models/application");
const Job = require("../models/job");
// ── NEW: Notification imports ──────────────────────────────────────────────
const { NotificationService } = require("../services/notificationService");
const { emitToUser, emitToMany } = require("../socket/socketManager");
// ───────────────────────────────────────────────────────────────────────────

//Company: Update status (Shortlist/Reject/Select)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
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

    // ── NEW: Fire notifications ──────────────────────────────────────────
    // try {
    //   const studentNotif = await NotificationService.applicationStatusChanged({
    //     application: app,
    //     newStatus: status,
    //   });
    //   if (studentNotif) emitToUser(app.studentId.toString(), studentNotif);

    //   if (status === "Selected") {
    //     const adminNotifs = await NotificationService.studentSelected({
    //       application: app,
    //     });
    //     adminNotifs.forEach((n) => emitToUser(n.recipientId.toString(), n));
    //   }
    // } catch (err) {
    //   console.error("Notification error:", err);
    // }
    // In updateApplicationStatus, replace your try block with:
    try {
      console.log(
        "[Notif] Firing for studentId:",
        app.studentId.toString(),
        "status:",
        status,
      );

      const studentNotif = await NotificationService.applicationStatusChanged({
        application: app,
        newStatus: status,
      });

      console.log(
        "[Notif] DB record created:",
        !!studentNotif,
        studentNotif?._id,
      );

      if (studentNotif) {
        emitToUser(app.studentId.toString(), studentNotif);
        console.log(
          "[Notif] emitToUser called for room: user:" +
            app.studentId.toString(),
        );
      }

      if (status === "Selected") {
        const adminNotifs = await NotificationService.studentSelected({
          application: app,
        });
        console.log("adminNotifs : ", adminNotifs);
        adminNotifs.forEach((n) => emitToUser(n.recipientId.toString(), n));
      }
    } catch (err) {
      console.error("[Notif] ERROR:", err.message, err.stack);
    }

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

    try {
      const companyNotif = await NotificationService.studentApplied({
        application,
      });
      if (companyNotif)
        emitToUser(application.companyId.toString(), companyNotif);
    } catch (err) {
      console.error("Notification error:", err);
    }

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
  // if (
  //   job.allowedBranches?.length > 0 &&
  //   !job.allowedBranches.includes(student.profile?.department)
  // ) {
  //   return "Not Eligible";
  // }
  if (
    job.allowedBranches?.length > 0 &&
    !job.allowedBranches
      .map((b) => b.toLowerCase().trim())
      .includes(student.profile?.department?.toLowerCase().trim())
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
