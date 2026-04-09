const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const logger = require('../utils/logger');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const token = generateToken(user._id);
    const userData = { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, lastLogin: user.lastLogin };

    logger.info(`User logged in: ${user.email}`);
    res.status(200).json({ success: true, data: { user: userData, token } });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await AuditLog.create({
      user: req.user._id,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user._id,
      ipAddress: req.ip,
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id);

    res.status(200).json({ success: true, message: 'Password changed successfully', data: { token } });
  } catch (error) {
    next(error);
  }
};
