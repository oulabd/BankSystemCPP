// delete-demo-users.js
// التشغيل بـ: node delete-demo-users.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
  await mongoose.connect(MONGO_URI);
  const emails = ['daktor@example.com', 'hasta@example.com'];
  const result = await User.deleteMany({ email: { $in: emails } });
  console.log(`تم حذف ${result.deletedCount} مستخدمين تجريبيين.`);
  mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
