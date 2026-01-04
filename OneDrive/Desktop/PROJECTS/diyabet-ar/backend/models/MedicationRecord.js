const mongoose = require('mongoose');

const medicationRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  medicationType: { 
    type: String, 
    required: true,
    enum: ['insulin', 'oral']
  },
  name: { type: String, required: true },
  dose: { type: Number, required: true, min: 0 },
  unit: { 
    type: String, 
    required: true,
    enum: ['IU', 'mg', 'mcg', 'mL']
  },
  timing: { 
    type: String, 
    required: true,
    enum: ['before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner', 'bedtime', 'other']
  },
  notes: { type: String },
  isRecommendation: { type: Boolean, default: false },
  linkedGlucoseRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyRecord' },
  recordedAt: { type: Date, default: Date.now, index: true },
  createdAt: { type: Date, default: Date.now }
});

// فهارس لتحسين كفاءة الاستعلامات
medicationRecordSchema.index({ patient: 1, recordedAt: -1 });
medicationRecordSchema.index({ doctor: 1, isRecommendation: 1 });
medicationRecordSchema.index({ patient: 1, medicationType: 1 });

module.exports = mongoose.model('MedicationRecord', medicationRecordSchema);
