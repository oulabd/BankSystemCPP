const mongoose = require('mongoose');

async function deleteDuplicateDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/diyabet_ar');
    
    console.log('\n🗑️  جاري حذف قاعدة البيانات: diyabet_ar');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ تم حذف قاعدة البيانات diyabet_ar بنجاح');
    
    await mongoose.disconnect();
    
    // التحقق من الحذف
    await mongoose.connect('mongodb://127.0.0.1:27017/');
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    console.log('\n📊 قواعد بيانات diyabet المتبقية:');
    databases
      .filter(db => db.name.includes('diyabet'))
      .forEach(db => console.log(`  - ${db.name}`));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('خطأ:', err);
    process.exit(1);
  }
}

deleteDuplicateDB();
