const Classroom = require('../models/Classroom.model');
const AuditLog = require('../models/AuditLog.model');

const paginate = (page = 1, limit = 20) => ({ skip: (page - 1) * limit, limit: parseInt(limit) });

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', roomType, minCapacity } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { roomNumber: { $regex: search, $options: 'i' } },
      { roomName: { $regex: search, $options: 'i' } },
    ];
    if (roomType) filter.roomType = roomType;
    if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };

    const { skip, limit: lim } = paginate(page, limit);
    const [data, total] = await Promise.all([
      Classroom.find(filter).skip(skip).limit(lim).sort({ roomNumber: 1 }),
      Classroom.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const room = await Classroom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Classroom not found' });
    res.json({ success: true, data: room });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const room = await Classroom.create(req.body);
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entityType: 'Classroom', entityId: room._id });
    res.status(201).json({ success: true, data: room, message: 'Classroom created successfully' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const room = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Classroom not found' });
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'Classroom', entityId: room._id, changes: req.body });
    res.json({ success: true, data: room, message: 'Classroom updated successfully' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const room = await Classroom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Classroom not found' });
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'Classroom', entityId: req.params.id });
    res.json({ success: true, message: 'Classroom deleted successfully' });
  } catch (err) { next(err); }
};

exports.getAvailable = async (req, res, next) => {
  try {
    const { minCapacity = 0 } = req.query;
    const rooms = await Classroom.find({ isActive: true, capacity: { $gte: parseInt(minCapacity) } }).sort({ capacity: 1 });
    res.json({ success: true, data: rooms });
  } catch (err) { next(err); }
};
