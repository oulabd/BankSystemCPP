const mongoose = require('mongoose');
const { Schema } = mongoose;
const { encryptText, decryptText } = require('../utils/encryption');

const DailyRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // اليوم مخزَّن مضبوطاً على 00:00:00 (تاريخ فقط)
    day: { type: Date, required: true },

    fasting: { type: Number, default: null },
    beforeBreakfast: { type: Number, default: null },
    afterBreakfast: { type: Number, default: null },
    beforeLunch: { type: Number, default: null },
    afterLunch: { type: Number, default: null },
    beforeDinner: { type: Number, default: null },
    afterDinner: { type: Number, default: null },

    // الوجبات الخفيفة
    snack1: { type: Number, default: null },
    snack2: { type: Number, default: null },
    snack3: { type: Number, default: null },

    // قياسات الليل
    measurement_12am: { type: Number, default: null },
    measurement_3am: { type: Number, default: null },

    // الكربوهيدرات
    breakfastCarbs: { type: Number, default: null },
    lunchCarbs: { type: Number, default: null },
    dinnerCarbs: { type: Number, default: null },

    // الإنسولين
    breakfastInsulin: { type: Number, default: null },
    lunchInsulin: { type: Number, default: null },
    dinnerInsulin: { type: Number, default: null },
    lantus: { type: Number, default: null },

    notes: { type: String }, // سيتم تشفيرها
  },
  { timestamps: true }
);

// تشفير الملاحظات قبل الحفظ
DailyRecordSchema.pre('save', async function (next) {
  if (this.isModified('notes') && this.notes && !this.notes.includes(':')) {
    this.notes = encryptText(this.notes);
  }

  next();
});

// دالة للحصول على البيانات بعد فك التشفير
DailyRecordSchema.methods.getDecryptedData = function () {
  return {
    ...this.toObject(),
    notes: this.notes ? decryptText(this.notes) : null,
  };
};

// فريد لكل مريض في كل يوم
DailyRecordSchema.index({ patientId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('DailyRecord', DailyRecordSchema);
