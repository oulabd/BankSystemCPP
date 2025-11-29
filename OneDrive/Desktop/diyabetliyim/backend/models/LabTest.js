const mongoose = require('mongoose');
const { Schema } = mongoose;

const LabTestSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testType: { type: String, required: true },
    testName: { type: String, required: true },
    resultValue: { type: String },
    resultUnit: { type: String },
    referenceRange: { type: String },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
    notes: { type: String },
    takenAt: { type: Date, required: true },
    reportedAt: { type: Date, default: Date.now },
    fileUrl: { type: String },
    isVisibleToPatient: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LabTestSchema.index({ patientId: 1, doctorId: 1, testType: 1, takenAt: -1 });

module.exports = mongoose.model('LabTest', LabTestSchema);

