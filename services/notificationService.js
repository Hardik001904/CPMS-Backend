/**
 * notificationService.js
 *
 * Central service for creating & broadcasting notifications.
 * Decoupled from Socket.io – the socket layer calls these helpers
 * and then pushes the result to connected clients.
 *
 * Usage:
 *   const { NotificationService } = require('../services/notificationService');
 *   const notif = await NotificationService.jobPosted({ job, studentIds });
 */

const Notification = require("../models/notification");
const User = require("../models/user");

class NotificationService {
  // ─── Helper ──────────────────────────────────────────────────────────────

  static async _create(data) {
    const notification = await Notification.create(data);
    return notification;
  }

  static async _createMany(dataArray) {
    if (!dataArray.length) return [];
    const notifications = await Notification.insertMany(dataArray);
    return notifications;
  }

  // ─── Student Notifications ────────────────────────────────────────────────

  /**
   * Notify eligible students when a company posts a new job.
   * @param {Object} job  - Mongoose Job document
   * @param {Array}  studentIds - Array of student ObjectIds to notify
   * @returns {Array} created notifications
   */
  static async jobPosted({ job, studentIds }) {
    if (!studentIds || !studentIds.length) return [];

    const docs = studentIds.map((studentId) => ({
      recipientId: studentId,
      recipientRole: "STUDENT",
      type: "JOB_POSTED",
      title: "New Job Opening!",
      message: `${job.companyName} posted a new position: ${job.title} in ${job.location || "N/A"}.`,
      metadata: {
        jobId: job._id,
        companyId: job.companyId,
        companyName: job.companyName,
        jobTitle: job.title,
      },
    }));

    return this._createMany(docs);
  }

  /**
   * Notify a student when their application status changes.
   * @param {Object} application - Mongoose Application document
   * @param {String} newStatus   - New status value
   */
  static async applicationStatusChanged({ application, newStatus }) {
    const typeMap = {
      Shortlisted: "APPLICATION_SHORTLISTED",
      Selected: "APPLICATION_SELECTED",
      Rejected: "APPLICATION_REJECTED",
    };

    const type = typeMap[newStatus];
    if (!type) return null; // Don't notify for non-terminal statuses

    const titleMap = {
      APPLICATION_SHORTLISTED: "🎉 You've been Shortlisted!",
      APPLICATION_SELECTED: "🏆 Congratulations! You're Selected!",
      APPLICATION_REJECTED: "Application Update",
    };

    const messageMap = {
      APPLICATION_SHORTLISTED: `Your application for ${application.jobTitle} at ${application.companyName} has been shortlisted. Prepare for next rounds!`,
      APPLICATION_SELECTED: `You have been selected for ${application.jobTitle} at ${application.companyName}. The placement team will contact you soon.`,
      APPLICATION_REJECTED: `Your application for ${application.jobTitle} at ${application.companyName} was not taken forward at this time. Keep applying!`,
    };

    return this._create({
      recipientId: application.studentId,
      recipientRole: "STUDENT",
      type,
      title: titleMap[type],
      message: messageMap[type], 
      metadata: {
        jobId: application.jobId,
        applicationId: application._id,
        companyId: application.companyId,
        companyName: application.companyName,
        jobTitle: application.jobTitle,
        studentId: application.studentId,
        studentName: application.studentName,
      },
    });
  }

  // ─── Company Notifications ────────────────────────────────────────────────

  /**
   * Notify a company when a student applies to their job.
   * @param {Object} application - Mongoose Application document
   */
  static async studentApplied({ application }) {
    return this._create({
      recipientId: application.companyId,
      recipientRole: "COMPANY",
      type: "STUDENT_APPLIED",
      title: "New Application Received",
      message: `${application.studentName} has applied for the position of ${application.jobTitle}.`,
      metadata: {
        jobId: application.jobId,
        applicationId: application._id,
        studentId: application.studentId,
        studentName: application.studentName,
        jobTitle: application.jobTitle,
        companyId: application.companyId,
        companyName: application.companyName,
      },
    });
  }

  // ─── Admin Notifications ──────────────────────────────────────────────────

  /**
   * Notify all admins when a new company registers.
   * @param {Object} company - Mongoose User document (role: COMPANY)
   */
  static async companyRegistered({ company }) {
    const admins = await User.find({ role: "ADMIN" }).select("_id");
    if (!admins.length) return [];

    const docs = admins.map((admin) => ({
      recipientId: admin._id,
      recipientRole: "ADMIN",
      type: "COMPANY_REGISTERED",
      title: "New Company Registered",
      message: `${company.name} has registered and is pending approval. Review their profile.`,
      metadata: {
        companyId: company._id,
        companyName: company.name,
      },
    }));

    return this._createMany(docs);
  }

  /**
   * Notify all admins when a student gets selected.
   * @param {Object} application - Mongoose Application document
   */
  static async studentSelected({ application }) {
    const admins = await User.find({ role: "ADMIN" }).select("_id");
    if (!admins.length) return [];

    const docs = admins.map((admin) => ({
      recipientId: admin._id,
      recipientRole: "ADMIN",
      type: "STUDENT_SELECTED",
      title: "Student Placement Confirmed",
      message: `${application.studentName} has been selected for ${application.jobTitle} at ${application.companyName}.`,
      metadata: {
        jobId: application.jobId,
        applicationId: application._id,
        studentId: application.studentId,
        studentName: application.studentName,
        companyId: application.companyId,
        companyName: application.companyName,
        jobTitle: application.jobTitle,
      },
    }));

    return this._createMany(docs);
  }
}

module.exports = { NotificationService };