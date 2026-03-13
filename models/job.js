const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    description: { type: String, required: true },
    criteria: { type: String },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    postedDate: { type: Date, default: Date.now },

    minCgpa: { type: Number, default: 0 },
    allowedBranches: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    backlogAllowed: { type: Boolean, default: true },
    passingYear: { type: Number },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", JobSchema);
