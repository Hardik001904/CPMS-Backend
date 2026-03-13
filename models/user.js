// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     // mobile: { type: Number, required: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: ["STUDENT", "COMPANY", "ADMIN"],
//       required: true,
//     },
//     createdAt: { type: Date, default: Date.now },
//     isApproved: { type: Boolean, default: false },

//     profile: {
//       // --- Student Specific Fields ---
//       department: String,
//       enrollmentNumber: String,
//       cgpa: { type: String, default: "0.0" },
//       gradYear: String,
//       dob: String,
//       skills: { type: [String], default: [] },
//       resumeUrl: String,

//       // --- Company Specific Fields ---
//       hrName: String,
//       industry: String,
//       website: String,
//       description: String,
//       location: String,
//       size: String,
//     },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["STUDENT", "COMPANY", "ADMIN"],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    // We use a single profile object but the controller will ensure
    // only relevant fields for the specific role are populated.
    profile: {
      // --- Student Specific Fields ---
      department: String,
      enrollmentNumber: String,

      cgpa: { type: String, default: "0.0" },
      gradYear: { type: String, default: "2026" },
      backlogCount: { type: Number, default: 0 },
      currentBacklog: { type: Boolean, default: false },
      // educationDetails: {
      //   tenth: String,
      //   twelfth: String,
      //   degree: String,
      // },
      skills: { type: [String], default: [] },
      phone: String,
      resumeUrl: String,

      // --- Company Specific Fields ---
      hrName: String,
      industry: String,
      website: String,

      description: String,
      location: String,
      size: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
