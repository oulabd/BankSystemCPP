require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function cleanupDoctors() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
    await mongoose.connect(MONGO_URI);
    console.log('✅ تم الاتصال بـ MongoDB');

    // حذف جميع الأطباء (يمكن إعادة إنشائهم من لوحة المسؤول)
    const result = await User.deleteMany({ role: 'doctor' });
    
    console.log(`✅ تم حذف ${result.deletedCount} طبيب/أطباء`);
    console.log('');
    console.log('يمكنك الآن إضافة أطباء جدد من لوحة المسؤول.');
    console.log('سيعمل التشفير بشكل صحيح للأطباء الجدد.');

    await mongoose.disconnect();
    console.log('✅ تم إغلاق اتصال قاعدة البيانات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

cleanupDoctors();
