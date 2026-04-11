const mongoose = require('mongoose');

const ConflictSchema = new mongoose.Schema(
  {
    conflictType: {
      type: String,
      enum: ['faculty', 'lab', 'classroom', 'capacity', 'workload', 'algorithm', 'working_hours'],
    },
    severity: { type: String, enum: ['high', 'medium', 'low'] },
    description: String,
    resolved: { type: Boolean, default: false },
  },
  { _id: false }
);

const SlotSchema = new mongoose.Schema({
  slotNumber: { type: mongoose.Schema.Types.Mixed }, // number or 'BREAK'
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
  labPart: { type: String, enum: ['Part A', 'Part B', null] },
  sessionType: { type: String, enum: ['Theory', 'Lab', 'Tutorial', 'Break'] },
  isBreak: { type: Boolean, default: false },
  duration: { type: Number }, // in minutes
}, { _id: false });

const DayScheduleSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
  slots: [SlotSchema],
}, { _id: false });

const ClassScheduleSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  dayWiseSchedule: [DayScheduleSchema],
}, { _id: false });

const TimetableSchema = new mongoose.Schema(
  {
    timetableName: { type: String, required: [true, 'Timetable name is required'], trim: true },
    academicYear: { type: String, required: [true, 'Academic year is required'] },
    semester: { type: String, required: [true, 'Semester is required'], enum: ['Odd', 'Even'] },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    workingHours: {
      startTime: { type: String, default: '07:30' },
      endTime: { type: String, default: '13:30' },
      breakTime: {
        start: { type: String, default: '10:30' },
        end: { type: String, default: '11:00' },
      },
    },
    workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    schedule: [ClassScheduleSchema],
    constraints: {
      noFreeSlots: { type: Boolean, default: true },
      maxFacultyHoursPerDay: { type: Number, default: 6 },
      labContinuousSlots: { type: Boolean, default: true },
    },
    conflicts: [ConflictSchema],
    fitnessScore: { type: Number, min: 0 },
    algorithm: { type: String, enum: ['genetic', 'backtracking', 'hybrid'], default: 'genetic' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TimetableSchema.index({ academicYear: 1, semester: 1, status: 1 });
TimetableSchema.index({ generatedBy: 1 });

TimetableSchema.methods.canEdit = function () {
  return this.status === 'draft';
};

TimetableSchema.methods.publish = async function () {
  const unresolvedHigh = this.conflicts.filter((c) => !c.resolved && c.severity === 'high');
  if (unresolvedHigh.length > 0) {
    throw new Error('Cannot publish timetable with unresolved high-severity conflicts');
  }
  this.status = 'published';
  return await this.save();
};

module.exports = mongoose.model('Timetable', TimetableSchema);
