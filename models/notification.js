const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["STUDENT", "COMPANY", "ADMIN"],
      required: true,
    },

    // Notification type for filtering & icons
    type: {
      type: String,
      enum: [
        // Student events
        "JOB_POSTED",         // New job opening from a company
        "APPLICATION_SHORTLISTED",
        "APPLICATION_SELECTED",
        "APPLICATION_REJECTED",
        // Company events
        "STUDENT_APPLIED",    // A student applied to their job
        // Admin events
        "COMPANY_REGISTERED", // New company registered, pending approval
        "STUDENT_SELECTED",   // A student got selected for a job
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Optional metadata for deep links
    metadata: {
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      jobTitle: String,
      companyName: String,
      studentName: String,
    },

    isRead: { type: Boolean, default: false, index: true },

    // For admin broadcast
    isBroadcast: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for fast queries
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);