require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
  await mongoose.connect(MONGO_URI);
  console.log('تم الاتصال بـ Mongo');

  // حذف المستخدمين الوهميين
  const mockEmails = ['remegala009@gmail.com', 'admin@diyabetliyim.com', 'rajabbojaerami@gmail.com'];
  
  for (const email of mockEmails) {
    const result = await User.deleteOne({ email });
    if (result.deletedCount > 0) {
      console.log(`✅ تم الحذف: ${email}`);
    } else {
      console.log(`⚠️  غير موجود: ${email}`);
    }
  }

  console.log('تم!');
  mongoose.disconnect();
}

main().catch(err=>{ console.error(err); process.exit(1); });
