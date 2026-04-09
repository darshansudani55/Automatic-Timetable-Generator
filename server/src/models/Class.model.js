const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema(
  {
    className: { type: String, required: [true, 'Class name is required'], unique: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: [true, 'Semester is required'], min: 1, max: 8 },
    section: { type: String, default: 'A', trim: true },
    academicYear: { type: String, required: [true, 'Academic year is required'], trim: true },
    studentCount: { type: Number, required: [true, 'Student count is required'], min: 1 },
    subjects: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
        labFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClassSchema.index({ department: 1, semester: 1, academicYear: 1 });
ClassSchema.index({ className: 1 });

module.exports = mongoose.model('Class', ClassSchema);
