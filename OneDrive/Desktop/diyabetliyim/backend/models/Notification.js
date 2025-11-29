const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    required: true,
    enum: ['record_high', 'record_low', 'prescription_new', 'lab_request', 'lab_result', 'comment', 'message', 'appointment']
  },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false, index: true },
  meta: { type: mongoose.Schema.Types.Mixed }, // additional data
  createdAt: { type: Date, default: Date.now, index: true }
});

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);