const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String },
  attachment: {
    url: String,
    type: { type: String, enum: ['image', 'pdf', 'link'] },
    filename: String,
    size: Number
  },
  linkToMedicalResource: { type: String },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

// فهارس مركبة لتحسين كفاءة الاستعلامات
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
