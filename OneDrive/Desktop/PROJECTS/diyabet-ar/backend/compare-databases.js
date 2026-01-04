const mongoose = require('mongoose');

async function compareDBs() {
  const db1Name = 'diyabet-ar';
  const db2Name = 'diyabet_ar';
  
  try {
    // الاتصال بقاعدة البيانات الأولى
    await mongoose.connect(`mongodb://127.0.0.1:27017/${db1Name}`);
    const db1 = mongoose.connection.db;
    const collections1 = await db1.listCollections().toArray();
    
    console.log(`\n📊 قاعدة البيانات: ${db1Name}`);
    console.log(`المجموعات: ${collections1.length}`);
    
    for (const coll of collections1) {
      const count = await db1.collection(coll.name).countDocuments();
      if (count > 0) {
        console.log(`  - ${coll.name}: ${count} مستندات`);
      }
    }
    
    await mongoose.disconnect();
    
    // الاتصال بقاعدة البيانات الثانية
    await mongoose.connect(`mongodb://127.0.0.1:27017/${db2Name}`);
    const db2 = mongoose.connection.db;
    const collections2 = await db2.listCollections().toArray();
    
    console.log(`\n📊 قاعدة البيانات: ${db2Name}`);
    console.log(`المجموعات: ${collections2.length}`);
    
    for (const coll of collections2) {
      const count = await db2.collection(coll.name).countDocuments();
      if (count > 0) {
        console.log(`  - ${coll.name}: ${count} مستندات`);
      }
    }
    
    await mongoose.disconnect();
    
    console.log('\n✅ اكتملت المقارنة');
    process.exit(0);
  } catch (err) {
    console.error('خطأ:', err);
    process.exit(1);
  }
}

compareDBs();
