// list-lab-types.js
// الاستخدام: node list-lab-types.js

const mongoose = require('mongoose');
const LabReport = require('./models/LabReport');

const MONGO_URI = 'mongodb://localhost:27017/diyabetliyim';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const types = await LabReport.distinct('type');
  console.log('أنواع التقارير المخبرية الفريدة في قاعدة البيانات:');
  types.forEach(t => console.log('-', t));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('خطأ:', err);
  process.exit(1);
});
