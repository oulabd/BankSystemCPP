require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
  await mongoose.connect(MONGO_URI);
  console.log('تم الاتصال بـ Mongo لتحميل البيانات\n');

  // إنشاء مستخدم المسؤول
  let admin = await User.findOne({ email: 'admin@diyabetliyim.com' });
  if(!admin){
    const hash = await bcrypt.hash('admin123', 10);
    admin = await User.create({ 
      fullName: 'مسؤول النظام', 
      email: 'admin@diyabetliyim.com', 
      password: hash, 
      role: 'admin', 
      identityNumber: 'ADMIN-001',
      isActive: true,
      isVerified: true
    });
    console.log('✅ تم إنشاء مستخدم المسؤول:');
    console.log(`   البريد الإلكتروني: admin@diyabetliyim.com`);
    console.log(`   كلمة المرور: admin123`);
    console.log(`   رقم الهوية: ADMIN-001\n`);
  } else {
    console.log('⚠️  مستخدم المسؤول موجود بالفعل');
  }

  // النسخة التجريبية: سيتم إنشاء مستخدم المسؤول فقط. تم إزالة مستخدمي المريض والطبيب التجريبيين.

  console.log('حسابات المسؤول والمريض والطبيب جاهزة.');
  mongoose.disconnect();
}

main().catch(err=>{ console.error(err); process.exit(1); });
