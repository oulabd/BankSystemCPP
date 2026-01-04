// سكريبت لإعادة تعيين حقول المستخدم المشفرة لمستخدم محدد بواسطة معرف المستخدم أو البريد الإلكتروني
// الاستخدام: node scripts/reset_encrypted_user_fields_for_user.js <معرف المستخدم أو البريد الإلكتروني>

const mongoose = require('mongoose');
const User = require('../models/User');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim';

async function resetUser(userIdOrEmail) {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  let user;
  if (userIdOrEmail.includes('@')) {
    user = await User.findOne({ email: userIdOrEmail });
  } else {
    user = await User.findById(userIdOrEmail);
  }
  if (!user) {
    console.error('لم يتم العثور على المستخدم:', userIdOrEmail);
    process.exit(1);
  }
  user.identityNumber = '';
  user.phone = '';
  user.address = '';
  await user.save();
  console.log(`تم إعادة تعيين الحقول المشفرة للمستخدم: ${user.email}`);
  await mongoose.disconnect();
}

const arg = process.argv[2];
if (!arg) {
  console.error('الاستخدام: node scripts/reset_encrypted_user_fields_for_user.js <معرف المستخدم أو البريد الإلكتروني>');
  process.exit(1);
}
resetUser(arg).catch(err => {
  console.error('خطأ في إعادة تعيين الحقول المشفرة:', err);
  process.exit(1);
});
