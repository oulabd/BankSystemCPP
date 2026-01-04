const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyUserByEmail() {
  try {
    // الحصول على البريد الإلكتروني من سطر الأوامر
    const email = process.argv[2];
    
    if (!email) {
      console.log('الاستخدام: node verify-user-manual.js <البريد الإلكتروني>');
      process.exit(1);
    }
    
    await mongoose.connect('mongodb://127.0.0.1:27017/diyabet-ar');
    
    console.log(`\n🔍 البحث عن المستخدم: ${email}`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ المستخدم غير موجود');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`\n👤 تم العثور على المستخدم: ${user.fullName}`);
    console.log(`   البريد الإلكتروني: ${user.email}`);
    console.log(`   موثق: ${user.isVerified ? 'نعم' : 'لا'}`);
    
    if (user.isVerified) {
      console.log('\n✅ المستخدم موثق بالفعل!');
    } else {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationExpires = undefined;
      await user.save();
      console.log('\n✅ تم توثيق المستخدم يدوياً بنجاح!');
    }
    
    console.log('\n📋 يمكنك الآن تسجيل الدخول باستخدام:');
    console.log(`   البريد الإلكتروني: ${user.email}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

verifyUserByEmail();
