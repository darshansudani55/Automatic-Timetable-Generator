const mongoose = require('mongoose');
const { LAB_TYPES } = require('../config/constants');

const LabSchema = new mongoose.Schema(
  {
    labCode: { type: String, required: [true, 'Lab code is required'], unique: true, uppercase: true, trim: true },
    labName: { type: String, required: [true, 'Lab name is required'], trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    building: { type: String, trim: true },
    floor: { type: String, trim: true },
    capacity: { type: Number, required: [true, 'Capacity is required'], min: 1 },
    hasParts: { type: Boolean, default: false },
    parts: [
      {
        partName: { type: String, enum: ['Part A', 'Part B'] },
        capacity: Number,
        location: String,
      },
    ],
    allowSimultaneousUse: { type: Boolean, default: false },
    equipment: [{ type: String }],
    labType: { type: String, enum: LAB_TYPES },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


LabSchema.index({ department: 1 });

module.exports = mongoose.model('Lab', LabSchema);
