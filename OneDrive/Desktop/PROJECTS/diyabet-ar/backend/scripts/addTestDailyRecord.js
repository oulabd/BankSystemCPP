// سكريبت لإضافة سجل يومي تجريبي للمريض
const mongoose = require('mongoose');
const DailyRecord = require('../models/DailyRecord');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim';
const patientId = process.argv[2]; // تمرير معرف المريض كمعامل

async function run() {
  await mongoose.connect(MONGO_URI);
  const patient = await User.findById(patientId);
  if (!patient) {
    console.error('لم يتم العثور على المريض:', patientId);
    process.exit(1);
  }
  const record = new DailyRecord({
    patientId: patient._id,
    day: new Date(),
    fasting: 110,
    beforeBreakfast: 120,
    afterBreakfast: 140,
    beforeLunch: 115,
    afterLunch: 130,
    beforeDinner: 100,
    afterDinner: 125,
    notes: 'قياس تجريبي',
  });
  await record.save();
  console.log('تمت إضافة سجل يومي تجريبي للمريض:', patient._id);
  mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
