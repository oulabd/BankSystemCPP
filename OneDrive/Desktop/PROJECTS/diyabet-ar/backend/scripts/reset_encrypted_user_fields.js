// سكريبت لإعادة تعيين حقول المستخدم المشفرة (رقم الهوية، الهاتف، العنوان) لجميع المستخدمين
// تحذير: سيؤدي هذا إلى مسح هذه الحقول بشكل نهائي لجميع المستخدمين!
// الاستخدام: node scripts/reset_encrypted_user_fields.js

const mongoose = require('mongoose');
const User = require('../models/User');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim';

async function resetEncryptedFields() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({});
  for (const user of users) {
    user.identityNumber = '';
    user.phone = '';
    user.address = '';
    await user.save();
    console.log(`تم إعادة تعيين الحقول المشفرة للمستخدم: ${user.email}`);
  }
  await mongoose.disconnect();
  console.log('تم إعادة تعيين جميع حقول المستخدم المشفرة.');
}

resetEncryptedFields().catch(err => {
  console.error('خطأ في إعادة تعيين الحقول المشفرة:', err);
  process.exit(1);
});
