const mongoose = require("mongoose");

/**
 * This model represents the "Master List" provided by the college registrar.
 * Students can only register if their details exist here first.
 */
const CollegeStudentSchema = new mongoose.Schema({
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("CollegeStudent", CollegeStudentSchema);
