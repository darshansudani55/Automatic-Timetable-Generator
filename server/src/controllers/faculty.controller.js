const Faculty = require('../models/Faculty.model');
const AuditLog = require('../models/AuditLog.model');

const paginate = (page = 1, limit = 20) => ({ skip: (page - 1) * limit, limit: parseInt(limit) });

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', department, status } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { facultyId: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (department) filter.department = department;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const { skip, limit: lim } = paginate(page, limit);
    const [data, total] = await Promise.all([
      Faculty.find(filter).populate('department', 'departmentCode departmentName').skip(skip).limit(lim).sort({ fullName: 1 }),
      Faculty.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('department', 'departmentCode departmentName');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, data: faculty });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const faculty = await Faculty.create(req.body);
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entityType: 'Faculty', entityId: faculty._id });
    res.status(201).json({ success: true, data: faculty, message: 'Faculty created successfully' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'Faculty', entityId: faculty._id, changes: req.body });
    res.json({ success: true, data: faculty, message: 'Faculty updated successfully' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Faculty', entityId: req.params.id });
    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (err) { next(err); }
};

exports.getByDepartment = async (req, res, next) => {
  try {
    const faculty = await Faculty.find({ department: req.params.departmentId, isActive: true }).sort({ fullName: 1 });
    res.json({ success: true, data: faculty });
  } catch (err) { next(err); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    faculty.isActive = !faculty.isActive;
    await faculty.save();
    res.json({ success: true, data: faculty });
  } catch (err) { next(err); }
};
