const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatMessageSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: String, enum: ['patient', 'doctor'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient queries
ChatMessageSchema.index({ patientId: 1, doctorId: 1, timestamp: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);