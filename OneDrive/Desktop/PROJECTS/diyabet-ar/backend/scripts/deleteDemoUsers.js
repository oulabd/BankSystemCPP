require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
  await mongoose.connect(MONGO_URI);
  console.log('تم الاتصال بـ MongoDB');

  const emails = ['hasta@example.com', 'daktor@example.com'];
  const result = await User.deleteMany({ email: { $in: emails } });
  console.log(`تم حذف ${result.deletedCount} مستخدمين برسائل البريد الإلكتروني:`, emails);

  mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
