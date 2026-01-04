const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshToken: { type: String, required: true, unique: true, index: true },
  userAgent: { type: String },
  ip: { type: String },
  device: { type: String }, // المتصفح + نظام التشغيل
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// إزالة الجلسات المنتهية تلقائياً
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
