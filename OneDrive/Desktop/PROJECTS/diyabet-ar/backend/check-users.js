const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/diyabet-ar');
    
    const db = mongoose.connection.db;
    
    // التحقق من مجموعة المستخدمين
    const usersCount = await db.collection('users').countDocuments();
    
    console.log('\n👥 المستخدمون في قاعدة بيانات diyabet-ar:');
    console.log(`إجمالي المستخدمين: ${usersCount}`);
    
    if (usersCount > 0) {
      const users = await db.collection('users').find({}).toArray();
      console.log('\nتفاصيل المستخدمين:');
      users.forEach((user, i) => {
        console.log(`\n${i + 1}. ${user.name || 'لا يوجد اسم'}`);
        console.log(`   البريد الإلكتروني: ${user.email}`);
        console.log(`   الدور: ${user.role}`);
        console.log(`   الهوية: ${user.tcNo || 'غير متوفر'}`);
        console.log(`   موثق: ${user.isVerified ? 'نعم' : 'لا'}`);
        console.log(`   تم الإنشاء: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'غير متوفر'}`);
      });
    } else {
      console.log('\n⚠️  لم يتم العثور على مستخدمين في قاعدة البيانات');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('خطأ:', err);
    process.exit(1);
  }
}

checkUsers();
