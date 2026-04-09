const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, required: [true, 'Department code is required'], unique: true, uppercase: true, trim: true },
    departmentName: { type: String, required: [true, 'Department name is required'], trim: true },
    hodName: { type: String, trim: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DepartmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', DepartmentSchema);
