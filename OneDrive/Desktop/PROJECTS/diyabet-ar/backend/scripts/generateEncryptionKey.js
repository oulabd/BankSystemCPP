const crypto = require('crypto');

console.log('='.repeat(60));
console.log('DIABETLIYIM - مولد مفتاح التشفير');
console.log('='.repeat(60));
console.log('\nمفتاح التشفير المُولد (32 بايت / 64 حرف هيكساديسيمال):');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('\n⚠️  هام: أضف هذا إلى ملف .env الخاص بك كـ ENCRYPTION_KEY');
console.log('⚠️  احتفظ بهذا المفتاح آمناً ولا تقم بنشره في نظام التحكم بالإصدارات!');
console.log('='.repeat(60));
