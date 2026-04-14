const application = require("../models/application");
const Job = require("../models/job");
const User = require("../models/user");
const { checkEligibility } = require("./applicationController");

// ── NEW: Notification imports ──────────────────────────────────────────────
const { NotificationService } = require("../services/notificationService");
const { emitToMany } = require("../socket/socketManager");
// ───────────────────────────────────────────────────────────────────────────

//Public: Get all active openings
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "Open" }).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Company: Get only jobs posted by this comFany
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.id }).sort({
      postedDate: -1,
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postJob = async (req, res) => {
  try {
    const {
      title,
      location,
      salary,
      jobDescription,
      criteria,
      requiredSkills,
      minCgpa,
      allowedBranches,
      industry,
      headquarters,
      hrName,
      website,
      jobType,
      deadline,
      numberOfPositions,
    } = req.body;
    const newJob = new Job({
      title,
      location,
      jobDescription,
      requiredSkills,
      minCgpa,
      allowedBranches,
      industry,
      headquarters,
      hrName,
      website,
      salary,
      jobType,
      deadline,
      numberOfPositions,
      criteria,
      companyId: req.user.id,
      companyName: req.user.name,
      status: "Open",
    });
    console.log("my job : ", req.body);
    await newJob.save();
    // ── NEW: Notify eligible students about new job ───────────────────────
    try {
      // Find all approved students
      const students = await User.find({
        role: "STUDENT",
        status: "APPROVED",
      }).select("_id profile");

      // Filter eligible students using existing checkEligibility helper
      console.log("students :",students)
      console.log("newJob :",newJob)
      const eligibleStudentIds = students
        .filter((s) => {
          const eligibility = checkEligibility(s, newJob);
          return eligibility === "Eligible";
        })
        .map((s) => s._id);
      console.log("eligibleStudentIds : ",eligibleStudentIds.length);

      if (eligibleStudentIds.length) {
        const notifications = await NotificationService.jobPosted({
          job: newJob,
          studentIds: eligibleStudentIds,
        });
        console.log("you last die");
        // Push real-time notification to each eligible student
        const notifMap = {};
        notifications.forEach((n) => {
          notifMap[n.recipientId.toString()] = n;
        });

        eligibleStudentIds.forEach((id) => {
          const notif = notifMap[id.toString()];
          if (notif) emitToMany([id.toString()], notif);
        });
        console.log("eligibleStudentIds :::::::::::::::fg ");
      }
      // console.log("eligibleStudentIds : ",notif)
    } catch (notifError) {
      console.error("Notification error (non-critical):", notifError);
    }
    // ────────────────────────────────────────────────────────────────────

    res.status(201).json(newJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Company: Closer?Re-open job
const updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Opening not found" });

    //Auth check
    if (job.companyId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    console.log("Current Status:", job.status);
    // job.status = job.status === "Open" ? "Closed" : "Open";
    const updatedStatus = job.status === "Open" ? "Closed" : "Open";
    job.status = updatedStatus;
    console.log("New Status:", updatedStatus);
    await job.save();

    res.json({ message: `Job is now ${job.status}`, job });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateJobRequirements = async (req, res) => {
  const job = await Job.findById(req.params.id);
  Object.assign(job, req.body);
  await job.save();

  const applications = await application.find({ jobId: job._id });
  for (const app of applications) {
    if (
      ["Applied", "Eligible", "Not Eligible", "Backlog Found"].includes(
        app.status,
      )
    ) {
      const student = await User.findById(app.studentId);
      app.status = checkEligibility(student, job);
      await app.save();
    }
  }
  res.json({ message: "Requirements updated and applications re-checked" });
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: "companyId",
      select: "profile.hrName profile.industry",
    });
    // console.log("job data : ", job);
    const response = {
      ...job._doc,
      hrName: job.companyId?.profile?.hrName,
      industry: job.companyId?.profile?.industry,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  postJob,
  getAllJobs,
  getMyJobs,
  updateJobStatus,
  updateJobRequirements,
  getJobById,
};
