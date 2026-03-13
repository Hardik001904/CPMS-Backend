const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    jobTitle: { type: String, required: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: { type: String, required: true },
    appliedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Rejected",
        "Selected",
        "Eligible",
        "Not Eligible",
        "Backlog Found",
      ],
      default: "Applied",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Application", ApplicationSchema);
