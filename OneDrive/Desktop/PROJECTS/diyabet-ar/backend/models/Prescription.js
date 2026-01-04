const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrescriptionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // الحقول الأساسية الموجزة المستخدمة حالياً في الواجهة
  type: { type: String, default: 'medication' },
  name: { type: String, required: true },
  dose: { type: String },
  frequency: { type: String },
  duration: { type: String },
  notes: { type: String },


  // عناصر تفصيلية للوصفات متعددة الأسطر
  items: [{
    name: { type: String, required: true },
    dose: { type: String, required: true },
    frequency: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: String } // اختياري
  }],

  // حقول بأسلوب e-Reçete
  verificationCode: { type: String, unique: true, required: true },
  verifyCode: { type: String, unique: true, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  auditLog: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    result: String // Valid/Expired/Cancelled/NotFound
  }],

  startDate: { type: Date },
  endDate: { type: Date },
  validity: { type: Number }, // بالأيام
  signature: { type: String },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);


