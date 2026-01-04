const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatMessageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messageText: { type: String },
    imageUrl: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// فهرس لتحسين كفاءة الاستعلامات
ChatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);