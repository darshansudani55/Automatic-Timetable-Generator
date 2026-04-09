const Timetable = require('../models/Timetable.model');
const Faculty = require('../models/Faculty.model');
const Department = require('../models/Department.model');
const Class = require('../models/Class.model');
const Classroom = require('../models/Classroom.model');
const Lab = require('../models/Lab.model');
const AuditLog = require('../models/AuditLog.model');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalDepts, totalFaculty, totalClasses, totalRooms, totalLabs, timetableStats, recentLogs] = await Promise.all([
      Department.countDocuments({ isActive: true }),
      Faculty.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true }),
      Classroom.countDocuments({ isActive: true }),
      Lab.countDocuments({ isActive: true }),
      Timetable.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AuditLog.find().populate('user', 'fullName email').sort({ timestamp: -1 }).limit(10),
    ]);

    const timetableCounts = { total: 0, published: 0, draft: 0, archived: 0 };
    timetableStats.forEach((s) => { timetableCounts[s._id] = s.count; timetableCounts.total += s.count; });

    res.json({
      success: true,
      data: {
        totalDepartments: totalDepts,
        totalFaculty,
        totalClasses,
        totalClassrooms: totalRooms,
        totalLabs,
        timetables: timetableCounts,
        recentActivity: recentLogs,
      },
    });
  } catch (err) { next(err); }
};

exports.getFacultyWorkload = async (req, res, next) => {
  try {
    const { timetableId } = req.params;
    const tt = await Timetable.findById(timetableId)
      .populate('schedule.dayWiseSchedule.slots.faculty', 'facultyId fullName designation department')
      .populate({ path: 'schedule.dayWiseSchedule.slots.faculty', populate: { path: 'department', select: 'departmentName' } });

    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });

    const workload = {};
    for (const cs of tt.schedule) {
      for (const ds of cs.dayWiseSchedule) {
        for (const slot of ds.slots) {
          if (!slot.faculty || slot.isBreak) continue;
          const fid = slot.faculty._id?.toString() || slot.faculty.toString();
          if (!workload[fid]) workload[fid] = { faculty: slot.faculty, totalHours: 0, theory: 0, lab: 0, days: {} };
          const dur = (slot.duration || 60) / 60;
          workload[fid].totalHours += dur;
          if (slot.sessionType === 'Lab') workload[fid].lab += dur;
          else workload[fid].theory += dur;
          if (!workload[fid].days[ds.day]) workload[fid].days[ds.day] = 0;
          workload[fid].days[ds.day] += dur;
        }
      }
    }

    res.json({ success: true, data: Object.values(workload) });
  } catch (err) { next(err); }
};

exports.getClassTimetable = async (req, res, next) => {
  try {
    const { timetableId, classId } = req.params;
    const tt = await Timetable.findById(timetableId)
      .populate('schedule.dayWiseSchedule.slots.subject', 'subjectCode subjectName credits')
      .populate('schedule.dayWiseSchedule.slots.faculty', 'facultyId fullName')
      .populate('schedule.dayWiseSchedule.slots.classroom', 'roomNumber roomName')
      .populate('schedule.dayWiseSchedule.slots.lab', 'labCode labName');

    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    const classSchedule = tt.schedule.find((s) => s.class?.toString() === classId);
    if (!classSchedule) return res.status(404).json({ success: false, message: 'Class not found in timetable' });

    res.json({ success: true, data: classSchedule });
  } catch (err) { next(err); }
};

exports.getClassroomUtilization = async (req, res, next) => {
  try {
    const { timetableId } = req.params;
    const tt = await Timetable.findById(timetableId).populate('schedule.dayWiseSchedule.slots.classroom', 'roomNumber roomName capacity roomType');
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });

    const util = {};
    const totalSlots = 5 * 6; // 5 days × 6 slots
    for (const cs of tt.schedule) {
      for (const ds of cs.dayWiseSchedule) {
        for (const slot of ds.slots) {
          if (!slot.classroom || slot.isBreak) continue;
          const rid = slot.classroom._id?.toString() || slot.classroom.toString();
          if (!util[rid]) util[rid] = { room: slot.classroom, usedSlots: 0, totalSlots };
          util[rid].usedSlots++;
        }
      }
    }

    const result = Object.values(util).map((u) => ({ ...u, utilizationPercent: Math.round((u.usedSlots / u.totalSlots) * 100) }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getLabUtilization = async (req, res, next) => {
  try {
    const { timetableId } = req.params;
    const tt = await Timetable.findById(timetableId).populate('schedule.dayWiseSchedule.slots.lab', 'labCode labName capacity labType');
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });

    const util = {};
    const totalSlots = 5 * 4;
    for (const cs of tt.schedule) {
      for (const ds of cs.dayWiseSchedule) {
        for (const slot of ds.slots) {
          if (!slot.lab || slot.isBreak) continue;
          const lid = slot.lab._id?.toString() || slot.lab.toString();
          if (!util[lid]) util[lid] = { lab: slot.lab, usedSlots: 0, totalSlots };
          util[lid].usedSlots++;
        }
      }
    }

    const result = Object.values(util).map((u) => ({ ...u, utilizationPercent: Math.round((u.usedSlots / u.totalSlots) * 100) }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AuditLog.find().populate('user', 'fullName email').sort({ timestamp: -1 }).skip(skip).limit(+limit),
      AuditLog.countDocuments(),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};
