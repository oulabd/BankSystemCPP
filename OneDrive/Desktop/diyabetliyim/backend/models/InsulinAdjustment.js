const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InsulinAdjustmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['short', 'long', 'mixed'], required: true },
  dose: { type: Number, required: true },
  notes: { type: String },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InsulinAdjustment', InsulinAdjustmentSchema);