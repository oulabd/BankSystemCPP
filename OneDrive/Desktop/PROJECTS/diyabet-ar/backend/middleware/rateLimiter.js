const User = require('../models/User');

/**
 * تقييد معدل طلبات إعادة تعيين كلمة المرور (بحد أقصى 3 كل ساعة)
 */
async function passwordResetRateLimiter(req, res, next) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // عدم الكشف عن وجود البريد - المتابعة بشكل طبيعي
      return next();
    }
    
    // تنظيف المحاولات القديمة (أقدم من ساعة)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    user.passwordResetAttempts = user.passwordResetAttempts.filter(
      attempt => attempt > oneHourAgo
    );
    
    // فحص تجاوز الحد
    if (user.passwordResetAttempts.length >= 3) {
      return res.status(429).json({ 
        error: 'عدد كبير من طلبات إعادة التعيين. يرجى المحاولة لاحقاً.' 
      });
    }
    
    // إضافة المحاولة الحالية
    user.passwordResetAttempts.push(new Date());
    await user.save();
    
    next();
  } catch (err) {
    console.error('خطأ في passwordResetRateLimiter:', err);
    next();
  }
}

module.exports = {
  passwordResetRateLimiter
};
