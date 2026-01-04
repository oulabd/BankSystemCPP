const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: ['upload', 'view', 'download', 'decrypt', 'access_denied', 'encryption', 'decryption']
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // المريض الذي تم الوصول إلى بياناته
  resourceType: { type: String, enum: ['lab_report', 'patient_data', 'medical_record'] },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  details: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

// فهرس لتحسين كفاءة الاستعلامات
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, action: 1 });
auditLogSchema.index({ resourceId: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
