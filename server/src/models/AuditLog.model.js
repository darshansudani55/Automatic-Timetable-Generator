const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'GENERATE', 'PUBLISH', 'EXPORT', 'LOGIN', 'LOGOUT'],
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Department', 'Faculty', 'Subject', 'Classroom', 'Lab', 'Class', 'Timetable', 'User'],
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
