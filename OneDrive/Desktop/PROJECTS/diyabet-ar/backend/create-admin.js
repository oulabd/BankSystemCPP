const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdminUser() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/diyabet-ar');
    
    console.log('\n👤 جاري إنشاء مستخدم المسؤول...');
    
    // التحقق من وجود المسؤول مسبقاً
    const existingAdmin = await User.findOne({ email: 'admin@diyabet-ar.com' });
    if (existingAdmin) {
      console.log('⚠️  مستخدم المسؤول موجود بالفعل!');
      console.log(`   البريد الإلكتروني: ${existingAdmin.email}`);
      console.log(`   الدور: ${existingAdmin.role}`);
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // إنشاء مستخدم المسؤول
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      fullName: 'مسؤول النظام',
      email: 'admin@diyabet-ar.com',
      password: hashedPassword,
      identityNumber: '99999999999', // معرف وهمي للمسؤول
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    
    await adminUser.save();
    
    console.log('✅ تم إنشاء مستخدم المسؤول بنجاح!');
    console.log('\n📋 بيانات تسجيل الدخول:');
    console.log('   البريد الإلكتروني: admin@diyabet-ar.com');
    console.log('   كلمة المرور: admin123');
    console.log('   الدور: admin');
    console.log('\n⚠️  يرجى تغيير كلمة المرور بعد أول تسجيل دخول!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

createAdminUser();
