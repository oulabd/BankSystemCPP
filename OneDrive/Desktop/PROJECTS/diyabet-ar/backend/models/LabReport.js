const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  fileUrl: { type: String, required: true }, // مسار الملف المشفر
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String }, // application/pdf, image/jpeg، إلخ
  isEncrypted: { type: Boolean, default: true },
  originalFileType: { type: String }, // تخزين نوع MIME الأصلي
  type: { 
    type: String, 
    required: true,
    enum: [
      'HbA1c', 'Açlık Glukoz', 'Glucose Fasting', 'Hemogram', 'CBC', 'Lipid Panel', 'Lipid Paneli',
      'Kidney Function', 'Böbrek Fonksiyonları', 'Liver Function', 'Karaciğer Fonksiyonları',
      'Thyroid', 'Tiroid', 'Urinalysis', 'İdrar Tahlili', 'Other', 'Diğer',
      // يمكن إضافة المزيد من الأنواع التاريخية/القديمة/الشائعة عند الحاجة
    ]
  },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'reviewed', 'retest', 'needs_followup']
  },
  doctorComment: { type: String },
  patientComment: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

// فهرس لتحسين كفاءة الاستعلامات
labReportSchema.index({ patient: 1, uploadedAt: -1 });
labReportSchema.index({ doctor: 1, status: 1 });

module.exports = mongoose.model('LabReport', labReportSchema);
