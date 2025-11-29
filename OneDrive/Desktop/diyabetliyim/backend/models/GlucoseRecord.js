const mongoose = require('mongoose');

const { Schema } = mongoose;

const GlucoseRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // day stored as a Date representing the date (time normalized to 00:00:00)
    day: { type: Date, required: true },

    // blood sugar readings
    fastingBS: { type: Number },
    beforeBreakfastBS: { type: Number },
    afterBreakfastBS: { type: Number },
    beforeLunchBS: { type: Number },
    afterLunchBS: { type: Number },
    beforeDinnerBS: { type: Number },
    afterDinnerBS: { type: Number },
    midnightBS: { type: Number },
    threeAMBS: { type: Number },

    // carbs
    breakfastCarbs: { type: Number },
    lunchCarbs: { type: Number },
    dinnerCarbs: { type: Number },

    // insulin units (numbers)
    breakfastInsulin: { type: Number },
    lunchInsulin: { type: Number },
    dinnerInsulin: { type: Number },

    // coefficients / insulin types / mixed units
    carbCoefficient: { type: Number },
    insulinType: { type: String }, // e.g., "Rapid", "Short", etc.
    mixedUnits: { type: Number },

    // long/rapid basal/bolus units
    lantusUnits: { type: Number },
    rapidUnits: { type: Number },

    // problems
    hadProblem: { type: Boolean, default: false },
    problemSubject: { type: String },
    problemExplain: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate records for the same patient + day
GlucoseRecordSchema.index({ patientId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('GlucoseRecord', GlucoseRecordSchema);