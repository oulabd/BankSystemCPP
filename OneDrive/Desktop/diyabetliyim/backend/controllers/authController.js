const bcrypt = require('bcrypt');
const User = require('../models/User');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  hashToken
} = require('../utils/emailService');
const {
  generateAccessToken,
  createSession,
  verifyRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  getActiveSessions
} = require('../utils/tokenService');

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check role if specified
    if (role && user.role !== role) {
      return res.status(403).json({ error: `Not a ${role}` });
    }
    
    // Check if user is approved (for doctors)
    if (user.role === 'doctor' && !user.isApproved) {
      return res.status(403).json({ error: 'Account not approved yet' });
    }
    
    // Check if user is active
    if (user.status === 'inactive' || user.status === 'banned') {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    // Verify password
    let passwordValid = true;
    if (user.passwordHash) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    }
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({ 
      id: user._id, 
      role: user.role 
    });
    
    // Create session
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    const { session, refreshToken } = await createSession(user._id, userAgent, ip);
    
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.fullName || user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/refresh
async function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const session = await verifyRefreshToken(refreshToken);
    
    if (!session) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Check if user is still active
    if (session.user.status === 'inactive' || session.user.status === 'banned') {
      await revokeSession(session._id);
      res.clearCookie('refreshToken');
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      id: session.user._id,
      role: session.user.role
    });
    
    res.json({
      accessToken,
      user: {
        id: session.user._id,
        name: session.user.fullName || session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    });
  } catch (err) {
    console.error('refresh error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      const session = await verifyRefreshToken(refreshToken);
      if (session) {
        await revokeSession(session._id);
      }
    }
    
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/logout-all
async function logoutAll(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    
    await revokeAllUserSessions(userId);
    res.clearCookie('refreshToken');
    
    res.json({ message: 'All sessions terminated successfully' });
  } catch (err) {
    console.error('logoutAll error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/auth/sessions
async function listSessions(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const currentRefreshToken = req.cookies.refreshToken;
    
    const sessions = await getActiveSessions(userId);
    
    const sessionsWithCurrent = sessions.map(session => ({
      id: session._id,
      device: session.device,
      ip: session.ip,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.refreshToken === currentRefreshToken
    }));
    
    res.json({ sessions: sessionsWithCurrent });
  } catch (err) {
    console.error('listSessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/auth/sessions/:id
async function revokeSessionById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    
    // Verify session belongs to user
    const session = await Session.findOne({ _id: id, user: userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await revokeSession(id);
    
    // If this is the current session, clear cookie
    if (session.refreshToken === req.cookies.refreshToken) {
      res.clearCookie('refreshToken');
    }
    
    res.json({ message: 'Session terminated' });
  } catch (err) {
    console.error('revokeSessionById error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/send-verification
async function sendVerification(req, res) {
  try {
    const { email, language = 'en' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    // Generic response - don't reveal if email exists
    if (!user) {
      return res.json({ message: 'If the email exists, a verification link has been sent.' });
    }
    
    if (user.isVerified) {
      return res.json({ message: 'Account already verified.' });
    }
    
    const { token, expires } = await sendVerificationEmail(user, language);
    
    user.verificationToken = token;
    user.verificationExpires = expires;
    await user.save();
    
    res.json({ message: 'Verification email sent successfully.' });
  } catch (err) {
    console.error('sendVerification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/auth/verify/:token
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    
    const hashedToken = hashToken(token);
    
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    
    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('verifyEmail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email, language = 'en' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    // Generic response - don't reveal if email exists
    if (!user) {
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }
    
    const { token, expires } = await sendPasswordResetEmail(user, language);
    
    user.resetToken = token;
    user.resetExpires = expires;
    await user.save();
    
    res.json({ message: 'Password reset email sent successfully.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const hashedToken = hashToken(token);
    
    const user = await User.findOne({
      resetToken: hashedToken,
      resetExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    user.passwordHash = passwordHash;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    user.passwordResetAttempts = []; // Clear reset attempts
    await user.save();
    
    // Revoke all existing sessions for security
    await revokeAllUserSessions(user._id);
    
    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  listSessions,
  revokeSessionById,
  sendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword
};
