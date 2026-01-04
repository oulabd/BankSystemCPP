const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v && v >= new Date();
        },
        message: 'تاريخ الموعد يجب أن يكون في المستقبل',
      },
    },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'rescheduled',
        'confirmed',
        'completed',
        'cancelled'
      ],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// ملاحظة: قيود التفرد لكل يوم تطبَّق في المتحكم (بفحص نطاق اليوم)
// لكن ننشئ فهرساً مساعداً للاستعلامات
AppointmentSchema.index({ patientId: 1, doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
