const mongoose = require('mongoose');
const { CREDIT_SESSIONS } = require('../config/constants');

const SubjectSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: [true, 'Subject code is required'], unique: true, uppercase: true, trim: true },
    subjectName: { type: String, required: [true, 'Subject name is required'], trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    credits: { type: Number, required: [true, 'Credits are required'], enum: [1, 2, 3, 4, 5, 6] },
    sessionsPerWeek: {
      theory: { type: Number, default: 0 },
      lab: { type: Number, default: 0 },
    },
    labDuration: { type: Number, default: 1.5 }, // hours
    requiresLab: { type: Boolean, default: false },
    semester: { type: Number, min: 1, max: 8 },
    isElective: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-calculate sessions based on credits
SubjectSchema.pre('save', function (next) {
  const sessions = CREDIT_SESSIONS[this.credits] || { theory: 0, lab: 0 };
  this.sessionsPerWeek = sessions;
  this.requiresLab = sessions.lab > 0;
  next();
});

SubjectSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
