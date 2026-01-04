// قم بتشغيل هذا السكريبت بـ: node remove-prescriptionId-index.js
// تأكد من صحة سلسلة اتصال MongoDB

const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/diyabetliyim'; // غيّر إذا لزم الأمر

async function removeIndex() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const result = await mongoose.connection.db.collection('prescriptions').dropIndex('prescriptionId_1');
    console.log('تم إزالة الفهرس:', result);
  } catch (err) {
    console.error('خطأ في إزالة الفهرس:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

removeIndex();
