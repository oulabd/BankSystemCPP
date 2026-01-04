// list-lab-missing-type.js
// الاستخدام: node list-lab-missing-type.js

const mongoose = require('mongoose');
const LabReport = require('./models/LabReport');

const MONGO_URI = 'mongodb://localhost:27017/diyabetliyim';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const missing = await LabReport.find({ $or: [ { type: { $exists: false } }, { type: '' }, { type: null } ] }, { fileName: 1, uploadedAt: 1 });
  if (missing.length === 0) {
    console.log('لا توجد تقارير مخبرية بنوع مفقود أو فارغ.');
  } else {
    console.log('التقارير المخبرية بنوع مفقود أو فارغ:');
    missing.forEach(r => console.log(`- ${r.fileName} (تم الرفع: ${r.uploadedAt})`));
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('خطأ:', err);
  process.exit(1);
});
