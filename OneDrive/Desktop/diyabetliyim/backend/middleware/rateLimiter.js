const User = require('../models/User');

/**
 * Rate limit password reset requests (max 3 per hour)
 */
async function passwordResetRateLimiter(req, res, next) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists - continue normally
      return next();
    }
    
    // Clean up old attempts (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    user.passwordResetAttempts = user.passwordResetAttempts.filter(
      attempt => attempt > oneHourAgo
    );
    
    // Check if limit exceeded
    if (user.passwordResetAttempts.length >= 3) {
      return res.status(429).json({ 
        error: 'Too many password reset requests. Please try again later.' 
      });
    }
    
    // Add current attempt
    user.passwordResetAttempts.push(new Date());
    await user.save();
    
    next();
  } catch (err) {
    console.error('passwordResetRateLimiter error:', err);
    next();
  }
}

module.exports = {
  passwordResetRateLimiter
};
