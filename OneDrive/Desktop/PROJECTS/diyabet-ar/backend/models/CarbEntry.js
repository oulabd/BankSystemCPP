const mongoose = require('mongoose');
const { Schema } = mongoose;

const CarbEntrySchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    foodName: { type: String, required: true },
    source: { type: String, enum: ['fatsecret', 'manual'], default: 'fatsecret' },
    grams: { type: Number, required: true },
    carbsPer100g: { type: Number, required: true },
    totalCarbs: { type: Number, required: true },
    notes: { type: String },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CarbEntry', CarbEntrySchema);