const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  glucose: { type: Number, required: true },
  unit: { type: String, default: 'mg/dL' },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SensorReading', SensorReadingSchema);
