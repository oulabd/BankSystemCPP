const mongoose = require('mongoose');
const { Schema } = mongoose;
const { encryptText, decryptText } = require('../utils/encryption');

const DailyRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // day stored normalized to 00:00:00 (date-only)
    day: { type: Date, required: true },

    fasting: { type: Number, default: null },
    beforeBreakfast: { type: Number, default: null },
    afterBreakfast: { type: Number, default: null },
    beforeLunch: { type: Number, default: null },
    afterLunch: { type: Number, default: null },
    beforeDinner: { type: Number, default: null },
    afterDinner: { type: Number, default: null },

    notes: { type: String }, // Will be encrypted
  },
  { timestamps: true }
);

// Encrypt notes before saving
DailyRecordSchema.pre('save', async function (next) {
  if (this.isModified('notes') && this.notes && !this.notes.includes(':')) {
    this.notes = encryptText(this.notes);
  }

  next();
});

// Method to get decrypted data
DailyRecordSchema.methods.getDecryptedData = function () {
  return {
    ...this.toObject(),
    notes: this.notes ? decryptText(this.notes) : null,
  };
};

// Unique per patient per day
DailyRecordSchema.index({ patientId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('DailyRecord', DailyRecordSchema);
