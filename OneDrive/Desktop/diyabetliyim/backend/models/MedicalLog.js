const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicalLogSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['prescription', 'lab_request', 'adjustment', 'diagnosis', 'comment'], required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalLog', MedicalLogSchema);