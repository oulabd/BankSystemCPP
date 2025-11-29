const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LabRequestSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testName: { type: String, required: true },
  status: { type: String, enum: ['requested', 'uploaded', 'reviewed'], default: 'requested' },
  resultFile: { type: String },
  doctorComment: { type: String },
  requestedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LabRequest', LabRequestSchema);