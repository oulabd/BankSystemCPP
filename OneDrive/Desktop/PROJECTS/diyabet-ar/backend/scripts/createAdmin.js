require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // استخدام bcryptjs لمطابقة authController
const User = require('../models/User');

async function createAdmin() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
    await mongoose.connect(MONGO_URI);
    console.log('✅ تم الاتصال بـ MongoDB');

    // التحقق من وجود المسؤول مسبقاً
    let admin = await User.findOne({ email: 'admin@diyabetliyim.com' });
    
    if (admin) {
      console.log('⚠️  مستخدم المسؤول موجود بالفعل');
      console.log('📧 البريد الإلكتروني:', admin.email);
      console.log('🔑 كلمة المرور: admin123');
      console.log('👤 الدور:', admin.role);
    } else {
      // إنشاء مستخدم مسؤول جديد
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      admin = await User.create({
        fullName: 'مسؤول النظام',
        email: 'admin@diyabetliyim.com',
        password: hashedPassword,
        identityNumber: 'ADMIN-001',
        role: 'admin',
        isActive: true,
        isVerified: true
      });

      console.log('✅ تم إنشاء مستخدم المسؤول بنجاح!');
      console.log('');
      console.log('📋 بيانات تسجيل الدخول للمسؤول:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 البريد الإلكتروني: admin@diyabetliyim.com');
      console.log('🔑 كلمة المرور: admin123');
      console.log('👤 الدور: admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('⚠️  هام: قم بتغيير كلمة المرور بعد أول تسجيل دخول!');
    }

    await mongoose.disconnect();
    console.log('✅ تم إغلاق اتصال قاعدة البيانات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إنشاء المسؤول:', error);
    process.exit(1);
  }
}

createAdmin();
