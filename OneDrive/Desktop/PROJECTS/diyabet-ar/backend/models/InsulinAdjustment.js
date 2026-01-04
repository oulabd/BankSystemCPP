const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InsulinAdjustmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  insulinType: { type: String, enum: ['short', 'long', 'mixed'] },
  dose: { type: Number, required: true },
  reason: { type: String, enum: ['highFasting', 'highPostMeal', 'abnormalHbA1c', 'other'] },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InsulinAdjustment', InsulinAdjustmentSchema);