const jwt = require('jsonwebtoken');

function verifyJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'لا يوجد رمز مصادقة' });
  
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'ترويسة مصادقة غير صالحة' });
  
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_secure');
    req.user = payload; // الحمولة الدنيا تحتوي على المعرّف والدور
    console.log('[verifyJWT] الحمولة المفككة للرمز:', payload);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'رمز مصادقة غير صالح' });
  }
}

module.exports = verifyJWT;
