const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/';

mongoose.connect(MONGO_URI, { directConnection: true })
  .then(async () => {
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    console.log('\n📊 قواعد بيانات MongoDB:\n');
    databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // تصفية قواعد بيانات diyabet
    const diyabetDbs = databases.filter(db => db.name.includes('diyabet'));
    if (diyabetDbs.length > 1) {
      console.log('\n⚠️  تم العثور على عدة قواعد بيانات diyabet:');
      diyabetDbs.forEach(db => {
        console.log(`  - ${db.name}`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('خطأ:', err);
    process.exit(1);
  });
