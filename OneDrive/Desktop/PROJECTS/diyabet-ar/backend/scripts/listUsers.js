require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
  await mongoose.connect(MONGO_URI);
  console.log('تم الاتصال بـ Mongo\n');

  const users = await User.find({}, { email: 1, fullName: 1, role: 1 });
  console.log('جميع المستخدمين في قاعدة البيانات:');
  users.forEach(u => {
    console.log(`  - ${u.email} (${u.role})`);
  });

  mongoose.disconnect();
}

main().catch(err=>{ console.error(err); process.exit(1); });
