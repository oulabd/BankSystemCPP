const crypto = require('crypto');

console.log('='.repeat(60));
console.log('DIABETLIYIM - Encryption Key Generator');
console.log('='.repeat(60));
console.log('\nGenerated Encryption Key (32 bytes / 64 hex characters):');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('\n⚠️  IMPORTANT: Add this to your .env file as ENCRYPTION_KEY');
console.log('⚠️  Keep this key secure and never commit it to version control!');
console.log('='.repeat(60));
