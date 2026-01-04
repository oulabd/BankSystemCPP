// سكريبت لإعادة حفظ أرقام الهوية لجميع المستخدمين بمفتاح التشفير الحالي
// الاستخدام: node backend/scripts/fix_identity_numbers.js

const mongoose = require('mongoose');
const User = require('../models/User');
const db = require('../config/db');

(async () => {
  try {
    await db();
    const users = await User.find({ identityNumber: { $exists: true, $ne: null } });
    let updated = 0;
    for (const user of users) {
      // إذا كان مفكوكاً بالفعل، تجاوز
      if (user.identityNumber && !user.identityNumber.includes(':')) continue;
      // فك التشفير وإعادة الحفظ بالمفتاح الحالي
      try {
        const decrypted = user.getDecryptedData().identityNumber;
        user.identityNumber = decrypted;
        await user.save();
        updated++;
        console.log(`تم تحديث المستخدم ${user.email}`);
      } catch (err) {
        console.error(`فشل للمستخدم ${user.email}:`, err.message);
      }
    }
    console.log(`تم. تم تحديث ${updated} مستخدمين.`);
    process.exit(0);
  } catch (err) {
    console.error('خطأ في السكريبت:', err);
    process.exit(1);
  }
})();
