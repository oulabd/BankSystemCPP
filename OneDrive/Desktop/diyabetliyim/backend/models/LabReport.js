const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  fileUrl: { type: String, required: true }, // Path to encrypted file
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String }, // application/pdf, image/jpeg, etc.
  isEncrypted: { type: Boolean, default: true },
  originalFileType: { type: String }, // Store original MIME type
  type: { 
    type: String, 
    required: true,
    enum: ['HbA1c', 'Glucose Fasting', 'CBC', 'Lipid Panel', 'Kidney Function', 'Liver Function', 'Thyroid', 'Urinalysis', 'Other']
  },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'reviewed', 'retest', 'needs_followup']
  },
  doctorComment: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

// Index for efficient queries
labReportSchema.index({ patient: 1, uploadedAt: -1 });
labReportSchema.index({ doctor: 1, status: 1 });

module.exports = mongoose.model('LabReport', labReportSchema);
