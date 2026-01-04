const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email (silent failure for security)
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving (extra security layer)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiry (15 minutes)
    user.resetToken = hashedToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send email with unhashed token
    await sendPasswordResetEmail(email, resetToken);

    return res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      message: 'An error occurred. Please try again later.' 
    });
  }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token from URL to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();

    return res.json({ 
      message: 'Password reset successful. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      message: 'An error occurred. Please try again later.' 
    });
  }
}

module.exports = {
  forgotPassword,
  resetPassword
};
