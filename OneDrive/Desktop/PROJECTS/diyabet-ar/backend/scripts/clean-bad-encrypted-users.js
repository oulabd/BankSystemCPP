// سكريبت لتنظيف (إفراغ) الحقول المشفرة التالفة للمستخدمين
const mongoose = require('mongoose');
const User = require('../models/User');
const { decryptText } = require('../utils/encryption');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim');
  const users = await User.find();
  let cleaned = [];
  for (const user of users) {
    let updated = false;
    const fields = ['identityNumber', 'phone', 'address'];
    for (const field of fields) {
      if (user[field] && typeof user[field] === 'string' && user[field].includes(':')) {
        try {
          decryptText(user[field]);
        } catch (err) {
          console.log(`تنظيف المستخدم ${user.email} (${user._id}) حقل ${field}: ${err.message}`);
          user[field] = null;
          updated = true;
        }
      }
    }
    if (updated) {
      await user.save();
      cleaned.push({ _id: user._id, email: user.email, fullName: user.fullName });
    }
  }
  if (cleaned.length === 0) {
    console.log('لا يوجد مستخدمون يحتاجون للتنظيف.');
  } else {
    console.log('المستخدمون المنظفون:');
    console.table(cleaned);
  }
  process.exit(0);
})();
