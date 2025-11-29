require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Mongo for seeding');

  // create doctor
  let doctor = await User.findOne({ email: 'doc@example.com' });
  if(!doctor){
    const hash = await bcrypt.hash('pass', 10);
    doctor = await User.create({ fullName: 'Demo Doctor', email: 'doc@example.com', password: hash, role: 'doctor', identityNumber: 'DOC-0001' });
    console.log('Created doctor:', doctor.email);
  } else console.log('Doctor exists');

  // create patient
  let patient = await User.findOne({ email: 'patient@example.com' });
  if(!patient){
    const hash = await bcrypt.hash('patient', 10);
    patient = await User.create({ fullName: 'Demo Patient', email: 'patient@example.com', password: hash, role: 'patient', assignedDoctor: doctor._id, identityNumber: 'PAT-0001' });
    console.log('Created patient:', patient.email);
  } else console.log('Patient exists');

  mongoose.disconnect();
}

main().catch(err=>{ console.error(err); process.exit(1); });
