// سكريبت لإضافة رمز التحقق المفقود لجميع الوصفات الطبية
const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim';

function generateVerificationCode() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const prescriptions = await Prescription.find({ $or: [ { verificationCode: { $exists: false } }, { verificationCode: null } ] });
  console.log('تم العثور على', prescriptions.length, 'وصفة طبية تفتقد رمز التحقق');
  for (const pres of prescriptions) {
    pres.verificationCode = generateVerificationCode();
    await pres.save();
    console.log('تم تحديث الوصفة الطبية', pres._id, 'برمز التحقق', pres.verificationCode);
  }
  await mongoose.disconnect();
  console.log('تم.');
}

main().catch(err => {
  console.error('خطأ:', err);
  process.exit(1);
});
