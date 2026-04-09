const Class = require('../models/Class.model');
const AuditLog = require('../models/AuditLog.model');

const paginate = (page = 1, limit = 20) => ({ skip: (page - 1) * limit, limit: parseInt(limit) });

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', department, semester, academicYear } = req.query;
    const filter = {};
    if (search) filter.className = { $regex: search, $options: 'i' };
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (academicYear) filter.academicYear = academicYear;

    const { skip, limit: lim } = paginate(page, limit);
    const [data, total] = await Promise.all([
      Class.find(filter)
        .populate('department', 'departmentCode departmentName')
        .populate({ path: 'subjects.subject', select: 'subjectCode subjectName credits sessionsPerWeek requiresLab' })
        .populate({ path: 'subjects.faculty', select: 'facultyId fullName' })
        .populate({ path: 'subjects.labFaculty', select: 'facultyId fullName' })
        .skip(skip).limit(lim).sort({ className: 1 }),
      Class.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('department', 'departmentCode departmentName')
      .populate({ path: 'subjects.subject', select: 'subjectCode subjectName credits sessionsPerWeek requiresLab labDuration' })
      .populate({ path: 'subjects.faculty', select: 'facultyId fullName email designation' })
      .populate({ path: 'subjects.labFaculty', select: 'facultyId fullName email designation' });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const cls = await Class.create(req.body);
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entityType: 'Class', entityId: cls._id });
    res.status(201).json({ success: true, data: cls, message: 'Class created successfully' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'Class', entityId: cls._id, changes: req.body });
    res.json({ success: true, data: cls, message: 'Class updated successfully' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Class', entityId: req.params.id });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (err) { next(err); }
};

exports.getByDepartment = async (req, res, next) => {
  try {
    const classes = await Class.find({ department: req.params.departmentId, isActive: true })
      .populate({ path: 'subjects.subject', select: 'subjectCode subjectName credits' })
      .sort({ className: 1 });
    res.json({ success: true, data: classes });
  } catch (err) { next(err); }
};
