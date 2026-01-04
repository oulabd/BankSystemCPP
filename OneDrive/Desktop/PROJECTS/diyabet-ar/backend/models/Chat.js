const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messageText: { type: String },
  imageUrl: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);