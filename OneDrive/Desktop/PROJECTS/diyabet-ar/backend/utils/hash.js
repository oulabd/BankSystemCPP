const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return await bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

module.exports = { hashPassword, comparePassword };
