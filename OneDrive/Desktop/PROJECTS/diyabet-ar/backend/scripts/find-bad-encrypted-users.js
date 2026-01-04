// Script to find users with bad encrypted fields (phone, identityNumber, address)
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/diyabetliyim');
  const users = await User.find();
  let bad = [];
  for (const user of users) {
    const fields = ['identityNumber', 'phone', 'address'];
    fields.forEach(field => {
      if (user[field]) {
        try {
          if (typeof user[field] === 'string' && user[field].includes(':')) {
            const { decryptText } = require('../utils/encryption');
            decryptText(user[field]);
          }
        } catch (err) {
          bad.push({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            field,
            value: user[field],
            error: err.message
          });
          // Log immediately for visibility
          console.log(`Bad decrypt for user ${user.email} (${user._id}) field ${field}: ${err.message}`);
        }
      }
    });
  }
  if (bad.length === 0) {
    console.log('No users with bad encrypted fields.');
  } else {
    console.log('Users with bad encrypted fields:');
    console.table(bad);
  }
  process.exit(0);
})();
