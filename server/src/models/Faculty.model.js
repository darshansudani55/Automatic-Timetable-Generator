const mongoose = require('mongoose');
const { DESIGNATION_TYPES } = require('../config/constants');

const FacultySchema = new mongoose.Schema(
  {
    facultyId: { type: String, required: [true, 'Faculty ID is required'], unique: true, trim: true },
    fullName: { type: String, required: [true, 'Full name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: String, enum: DESIGNATION_TYPES },
    specialization: [{ type: String }],
    maxWeeklyHours: { type: Number, default: 25, min: 1, max: 40 },
    preferredTimeSlots: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
    unavailableSlots: [
      {
        day: String,
        startTime: String,
        endTime: String,
        reason: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FacultySchema.index({ department: 1 });

module.exports = mongoose.model('Faculty', FacultySchema);
