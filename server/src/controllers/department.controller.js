const Department = require('../models/Department.model');
const AuditLog = require('../models/AuditLog.model');

const paginate = (page = 1, limit = 10) => ({ skip: (page - 1) * limit, limit: parseInt(limit) });

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { departmentCode: { $regex: search, $options: 'i' } },
      { departmentName: { $regex: search, $options: 'i' } },
    ];
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const { skip, limit: lim } = paginate(page, limit);
    const [data, total] = await Promise.all([
      Department.find(filter).skip(skip).limit(lim).sort({ createdAt: -1 }),
      Department.countDocuments(filter),
    ]);

    res.json({ success: true, data, pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const dept = await Department.create({ ...req.body, createdBy: req.user._id });
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entityType: 'Department', entityId: dept._id, changes: req.body });
    res.status(201).json({ success: true, data: dept, message: 'Department created successfully' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'Department', entityId: dept._id, changes: req.body });
    res.json({ success: true, data: dept, message: 'Department updated successfully' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Department', entityId: req.params.id });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) { next(err); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    dept.isActive = !dept.isActive;
    await dept.save();
    res.json({ success: true, data: dept, message: `Department ${dept.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
};
