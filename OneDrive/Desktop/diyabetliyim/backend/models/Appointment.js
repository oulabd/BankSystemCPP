const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v && v >= new Date();
        },
        message: 'Appointment date must be in the future',
      },
    },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'rescheduled'],
      default: 'pending',
    },
    messageFromDoctor: { type: String },
  },
  { timestamps: true }
);

// Note: unique-per-day constraint enforced in controller (by day range check)
// but create a helpful index for queries
AppointmentSchema.index({ patientId: 1, doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
