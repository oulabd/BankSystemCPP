// سكريبت لتنظيف (إفراغ) الحقول المشفرة التالفة للأطباء فقط
const mongoose = require('mongoose');
const User = require('../models/User');
const { decryptText } = require('../utils/encryption');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim');
  const doctors = await User.find({ role: 'doctor' });
  let cleaned = [];
  for (const doctor of doctors) {
    let updated = false;
    const fields = ['identityNumber', 'phone', 'address'];
    for (const field of fields) {
      if (doctor[field] && typeof doctor[field] === 'string' && doctor[field].includes(':')) {
        try {
          decryptText(doctor[field]);
        } catch (err) {
          console.log(`تنظيف الطبيب ${doctor.email} (${doctor._id}) حقل ${field}: ${err.message}`);
          doctor[field] = null;
          updated = true;
        }
      }
    }
    if (updated) {
      await doctor.save();
      cleaned.push({ _id: doctor._id, email: doctor.email, fullName: doctor.fullName });
    }
  }
  if (cleaned.length === 0) {
    console.log('لا يوجد أطباء يحتاجون للتنظيف.');
  } else {
    console.log('الأطباء المنظفون:');
    console.table(cleaned);
  }
  process.exit(0);
})();
