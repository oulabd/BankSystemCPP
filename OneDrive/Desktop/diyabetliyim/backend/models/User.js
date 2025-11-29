const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { encryptText, decryptText } = require('../utils/encryption');

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    identityNumber: { type: String, required: true, unique: true }, // Will be encrypted
    password: { type: String },
    phone: { type: String }, // Will be encrypted
    address: { type: String }, // Will be encrypted
    birthDate: { type: Date },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isApproved: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    resetToken: { type: String },
    resetExpires: { type: Date },
    passwordResetAttempts: [{ type: Date }], // Track reset attempts for rate limiting
  },
  { timestamps: true }
);

// Encrypt sensitive fields before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('identityNumber') && this.identityNumber && !this.identityNumber.includes(':')) {
    this.identityNumber = encryptText(this.identityNumber);
  }

  if (this.isModified('phone') && this.phone && !this.phone.includes(':')) {
    this.phone = encryptText(this.phone);
  }

  if (this.isModified('address') && this.address && !this.address.includes(':')) {
    this.address = encryptText(this.address);
  }

  next();
});

// Method to get decrypted data
UserSchema.methods.getDecryptedData = function () {
  return {
    ...this.toObject(),
    identityNumber: this.identityNumber ? decryptText(this.identityNumber) : null,
    phone: this.phone ? decryptText(this.phone) : null,
    address: this.address ? decryptText(this.address) : null,
  };
};

// Remove sensitive fields when converting to JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);



