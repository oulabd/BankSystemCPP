const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrescriptionItemSchema = new Schema({
  name: { type: String, required: true },
  dose: { type: String, required: true },
  frequency: { type: String, required: true },
  type: { type: String, enum: ['medication', 'insulin', 'sensor', 'device'], required: true }
});

const PrescriptionSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [PrescriptionItemSchema],
  notes: { type: String },
  qrCode: { type: String }, // path to QR code image
  verifyCode: { type: String, unique: true }, // unique code for verification
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);


