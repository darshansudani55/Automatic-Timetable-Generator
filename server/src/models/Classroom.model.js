const mongoose = require('mongoose');
const { ROOM_TYPES, FACILITIES } = require('../config/constants');

const ClassroomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: [true, 'Room number is required'], unique: true, trim: true },
    roomName: { type: String, trim: true },
    building: { type: String, trim: true },
    floor: { type: String, trim: true },
    capacity: { type: Number, required: [true, 'Capacity is required'], min: 1 },
    roomType: { type: String, enum: ROOM_TYPES, default: 'Classroom' },
    facilities: [{ type: String, enum: FACILITIES }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


ClassroomSchema.index({ capacity: 1 });

module.exports = mongoose.model('Classroom', ClassroomSchema);
