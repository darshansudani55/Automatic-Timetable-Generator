const Lab = require('../models/Lab.model');
const AuditLog = require('../models/AuditLog.model');

const paginate = (page = 1, limit = 20) => ({ skip: (page - 1) * limit, limit: parseInt(limit) });

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', department, labType } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { labCode: { $regex: search, $options: 'i' } },
      { labName: { $regex: search, $options: 'i' } },
    ];
    if (department) filter.department = department;
    if (labType) filter.labType = labType;

    const { skip, limit: lim } = paginate(page, limit);
    const [data, total] = await Promise.all([
      Lab.find(filter).populate('department', 'departmentCode departmentName').skip(skip).limit(lim).sort({ labCode: 1 }),
      Lab.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id).populate('department', 'departmentCode departmentName');
    if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
    res.json({ success: true, data: lab });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const lab = await Lab.create(req.body);
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entityType: 'Lab', entityId: lab._id });
    res.status(201).json({ success: true, data: lab, message: 'Lab created successfully' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'Lab', entityId: lab._id, changes: req.body });
    res.json({ success: true, data: lab, message: 'Lab updated successfully' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Lab', entityId: req.params.id });
    res.json({ success: true, message: 'Lab deleted successfully' });
  } catch (err) { next(err); }
};

exports.getAvailable = async (req, res, next) => {
  try {
    const labs = await Lab.find({ isActive: true }).populate('department', 'departmentCode departmentName').sort({ labCode: 1 });
    res.json({ success: true, data: labs });
  } catch (err) { next(err); }
};
