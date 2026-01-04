const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { encryptText, decryptText } = require('../utils/encryption');

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // كلمة مرور مموهة
    identityNumber: { type: String, required: true, unique: true }, // سيتم تشفيرها
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    isActive: { type: Boolean, default: true },
    
    // حقول خاصة بالمريض
    dob: { type: Date },
    birthdate: { type: Date },
    address: { type: String }, // سيتم تشفيره
    doctorName: { type: String },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // تعليمات المريض (ملاحظات الطبيب)
    instructions: [
      {
        text: { type: String, required: true },
        doctor: { type: Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now }
      }
    ],
    
    // حقول خاصة بالطبيب
    phone: { type: String }, // سيتم تشفيره
    nationalId: { type: String },
    
    // رموز التوثيق
    resetToken: { type: String, default: null },
    resetTokenExpire: { type: Date, default: null },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    passwordResetAttempts: [{ type: Date }], // تتبع محاولات إعادة التعيين لتقييد المعدل
  },
  { timestamps: true }
);

// تشفير الحقول الحساسة قبل الحفظ
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

// دالة للحصول على البيانات بعد فك التشفير
UserSchema.methods.getDecryptedData = function () {
  const obj = { ...this.toObject() };
  
  // محاولة فك التشفير، لكن إعادة القيمة الأصلية إذا فشل فك التشفير (قد لا تكون البيانات مشفرة)
  try {
    obj.identityNumber = this.identityNumber && this.identityNumber.includes(':') 
      ? decryptText(this.identityNumber) 
      : this.identityNumber;
  } catch (err) {
    obj.identityNumber = this.identityNumber;
  }
  
  try {
    obj.phone = this.phone && this.phone.includes(':') 
      ? decryptText(this.phone) 
      : this.phone;
  } catch (err) {
    obj.phone = this.phone;
  }
  
  try {
    obj.address = this.address && this.address.includes(':') 
      ? decryptText(this.address) 
      : this.address;
  } catch (err) {
    obj.address = this.address;
  }
  
  return obj;
};

// إزالة الحقول الحساسة عند التحويل إلى JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);



