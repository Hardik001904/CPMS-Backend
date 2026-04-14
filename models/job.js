const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    minCgpa: { type: Number, default: 0 },
    allowedBranches: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    jobDescription: { type: String, required: true },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    jobType: {
      type: String,
      enum: ["Internship", "Full Time"],
      required: true,
    },
    deadline: {type : Date },
    numberOfPositions: { type: Number, default: 1},
    backlogAllowed: { type: Boolean, default: true },

    postedDate: { type: Date, default: Date.now },
    
    criteria: { type: String },
    passingYear: { type: Number },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", JobSchema);
