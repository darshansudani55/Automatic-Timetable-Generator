const Timetable = require('../models/Timetable.model');
const AuditLog = require('../models/AuditLog.model');
const { generateSchedule } = require('../services/timetable.service');
const logger = require('../utils/logger');
const { WORKING_DAYS } = require('../config/constants');

exports.generate = async (req, res, next) => {
  try {
    const { academicYear, semester, classes: classIds, workingHours, constraints, algorithm = 'genetic', timetableName } = req.body;
    if (!academicYear || !semester || !classIds || !classIds.length) {
      return res.status(400).json({ success: false, message: 'academicYear, semester, and classes are required' });
    }

    const wh = workingHours || { startTime: '07:30', endTime: '13:30', breakTime: { start: '10:30', end: '11:00' } };
    const cons = constraints || { noFreeSlots: true, maxFacultyHoursPerDay: 6, labContinuousSlots: true };

    logger.info(`Generating timetable for ${classIds.length} classes using ${algorithm}`);

    const { schedule, conflicts, fitness } = await generateSchedule(
      { classIds, workingHours: wh, workingDays: WORKING_DAYS, constraints: cons, algorithm },
      (p) => logger.info(`Algorithm progress: ${p.generation}/${p.totalGenerations} | fitness: ${p.bestFitness}`)
    );

    const tt = await Timetable.create({
      timetableName: timetableName || `${academicYear} ${semester} Semester`,
      academicYear, semester, workingHours: wh, workingDays: WORKING_DAYS,
      schedule, constraints: cons, conflicts, fitnessScore: fitness,
      algorithm, generatedBy: req.user._id,
    });

    await AuditLog.create({ user: req.user._id, action: 'GENERATE', entityType: 'Timetable', entityId: tt._id });
    logger.info(`Timetable generated: ${tt._id} | fitness: ${fitness}`);

    res.status(201).json({ success: true, message: 'Timetable generated successfully', data: { timetableId: tt._id, fitnessScore: fitness, conflicts, status: tt.status } });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, academicYear, semester } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Timetable.find(filter).populate('generatedBy', 'fullName email').select('-schedule').skip(skip).limit(+limit).sort({ createdAt: -1 }),
      Timetable.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const tt = await Timetable.findById(req.params.id)
      .populate('generatedBy', 'fullName email')
      .populate({ path: 'schedule.class', select: 'className semester section studentCount department', populate: { path: 'department', select: 'departmentCode departmentName' } })
      .populate('schedule.dayWiseSchedule.slots.subject', 'subjectCode subjectName credits')
      .populate('schedule.dayWiseSchedule.slots.faculty', 'facultyId fullName designation')
      .populate('schedule.dayWiseSchedule.slots.classroom', 'roomNumber roomName capacity')
      .populate('schedule.dayWiseSchedule.slots.lab', 'labCode labName capacity');
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: tt });
  } catch (err) { next(err); }
};

exports.publish = async (req, res, next) => {
  try {
    const tt = await Timetable.findById(req.params.id);
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    await tt.publish();
    await AuditLog.create({ user: req.user._id, action: 'PUBLISH', entityType: 'Timetable', entityId: tt._id });
    res.json({ success: true, data: tt, message: 'Timetable published' });
  } catch (err) { next(err); }
};

exports.archive = async (req, res, next) => {
  try {
    const tt = await Timetable.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: tt, message: 'Timetable archived' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const tt = await Timetable.findByIdAndDelete(req.params.id);
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Timetable', entityId: req.params.id });
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) { next(err); }
};

exports.updateSlot = async (req, res, next) => {
  try {
    const { classId, day, slotIndex, updates } = req.body;
    const tt = await Timetable.findById(req.params.id);
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    if (!tt.canEdit()) return res.status(400).json({ success: false, message: 'Only draft timetables can be edited' });

    const classSchedule = tt.schedule.find((s) => s.class.toString() === classId);
    if (!classSchedule) return res.status(404).json({ success: false, message: 'Class not in timetable' });

    const daySchedule = classSchedule.dayWiseSchedule.find((d) => d.day === day);
    if (!daySchedule) return res.status(404).json({ success: false, message: 'Day not found' });

    if (slotIndex < 0 || slotIndex >= daySchedule.slots.length) return res.status(400).json({ success: false, message: 'Invalid slot index' });

    Object.assign(daySchedule.slots[slotIndex], updates);
    await tt.save();
    res.json({ success: true, message: 'Slot updated', data: tt });
  } catch (err) { next(err); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [total, published, draft, archived] = await Promise.all([
      Timetable.countDocuments(),
      Timetable.countDocuments({ status: 'published' }),
      Timetable.countDocuments({ status: 'draft' }),
      Timetable.countDocuments({ status: 'archived' }),
    ]);
    res.json({ success: true, data: { total, published, draft, archived } });
  } catch (err) { next(err); }
};
