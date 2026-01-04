const mongoose = require('mongoose');

const { Schema } = mongoose;

const GlucoseRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // اليوم مخزَّن كقيمة تاريخ مع الوقت مضبوطاً على 00:00:00
    day: { type: Date, required: true },

    // قراءات سكر الدم
    fastingBS: { type: Number },
    beforeBreakfastBS: { type: Number },
    afterBreakfastBS: { type: Number },
    beforeLunchBS: { type: Number },
    afterLunchBS: { type: Number },
    beforeDinnerBS: { type: Number },
    afterDinnerBS: { type: Number },
    midnightBS: { type: Number },
    threeAMBS: { type: Number },

    // الكربوهيدرات
    breakfastCarbs: { type: Number },
    lunchCarbs: { type: Number },
    dinnerCarbs: { type: Number },

    // وحدات الإنسولين (أرقام)
    breakfastInsulin: { type: Number },
    lunchInsulin: { type: Number },
    dinnerInsulin: { type: Number },

    // معاملات / أنواع الإنسولين / وحدات مختلطة
    carbCoefficient: { type: Number },
    insulinType: { type: String }, // مثل "Rapid"، "Short"، إلخ
    mixedUnits: { type: Number },

    // وحدات الإنسولين الطويل/السريع القاعدي/البلعي
    lantusUnits: { type: Number },
    rapidUnits: { type: Number },

    // المشاكل
    hadProblem: { type: Boolean, default: false },
    problemSubject: { type: String },
    problemExplain: { type: String },
  },
  {
    timestamps: true,
  }
);

// منع السجلات المكررة لنفس المريض ونفس اليوم
GlucoseRecordSchema.index({ patientId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('GlucoseRecord', GlucoseRecordSchema);