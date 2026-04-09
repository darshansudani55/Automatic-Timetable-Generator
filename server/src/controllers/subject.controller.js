const Subject = require('../models/Subject.model');
const AuditLog = require('../models/AuditLog.model');
const { CREDIT_SESSIONS } = require('../config/constants');

const paginate = (page = 1, limit = 20) => ({ skip: (page - 1) * limit, limit: parseInt(limit) });

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', department, semester } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { subjectCode: { $regex: search, $options: 'i' } },
      { subjectName: { $regex: search, $options: 'i' } },
    ];
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);

    const { skip, limit: lim } = paginate(page, limit);
    const [data, total] = await Promise.all([
      Subject.find(filter).populate('department', 'departmentCode departmentName').skip(skip).limit(lim).sort({ subjectCode: 1 }),
      Subject.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('department', 'departmentCode departmentName');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entityType: 'Subject', entityId: subject._id });
    res.status(201).json({ success: true, data: subject, message: 'Subject created successfully' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    // If credits are updated, recalculate sessions
    if (req.body.credits) {
      const sessions = CREDIT_SESSIONS[req.body.credits] || { theory: 0, lab: 0 };
      req.body.sessionsPerWeek = sessions;
      req.body.requiresLab = sessions.lab > 0;
    }
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'Subject', entityId: subject._id, changes: req.body });
    res.json({ success: true, data: subject, message: 'Subject updated successfully' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Subject', entityId: req.params.id });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) { next(err); }
};

exports.getByDepartment = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ department: req.params.departmentId, isActive: true }).sort({ subjectCode: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
};

exports.calculateSessions = async (req, res, next) => {
  try {
    const { credits } = req.params;
    const sessions = CREDIT_SESSIONS[parseInt(credits)];
    if (!sessions) return res.status(400).json({ success: false, message: 'Invalid credits' });
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
};
