const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LabRequestSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tests: {
    type: [String],
    enum: [
      'bloodGlucose',
      'hba1c',
      'lipidProfile',
      'kidneyFunction',
      'liverFunction',
      'thyroid',
      'urineAnalysis'
    ],
    required: true
  },
  status: { type: String, enum: ['pending', 'uploaded', 'reviewed'], default: 'pending' },
  notes: { type: String },
  resultFile: { type: String },
  reviewNotes: { type: String },
  reviewedAt: { type: Date },
  dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('LabRequest', LabRequestSchema);