const bcrypt = require('bcryptjs'); // switched to bcryptjs
const User = require('../models/User');
const {
  generateAccessToken,
  createSession,
  revokeAllUserSessions
} = require('../utils/tokenService');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  hashToken
} = require('../utils/emailService');

// helper: get first defined value from candidate keys
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}
function trimIfString(v) {
  return typeof v === 'string' ? v.trim() : v;
}

// POST /auth/register
async function register(req, res) {
  try {
    // normalize body (supports { data: { ... } } or plain body)
    const raw = req.body || {};
    const body = (raw && typeof raw.data === 'object') ? raw.data : raw;

    // ...existing code...

    // Normalize incoming fields to handle multiple frontend variants
    const fullName = trimIfString(
      pick(
        body,
        'fullName',
        'name',
        'full_name'
      ) || [trimIfString(body.firstName), trimIfString(body.lastName)].filter(Boolean).join(' ')
    );

    const identityNumber = trimIfString(
      pick(body, 'identityNumber', 'nationalId', 'identity', 'identity_number')
    );

    const email = trimIfString(pick(body, 'email', 'username'));
    const password = pick(body, 'password');

    const birthdate = trimIfString(pick(body, 'birthdate', 'dob'));
    const address = trimIfString(pick(body, 'address'));
    const doctorName = trimIfString(pick(body, 'doctorName', 'doctor'));

    if (!email || !password || !fullName || !identityNumber) {
      return res.status(400).json({ message: 'Full name, identity number, email, and password are required.' });
    }

    const existing = await User.findOne({ $or: [{ email }, { identityNumber }] });
    if (existing) {
      return res.status(400).json({ message: 'Email or identity number is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Map to expected schema fields (keep both dob and birthdate to be safe)
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      identityNumber,
      dob: birthdate,          // if schema uses `dob`
      birthdate,               // if schema uses `birthdate`
      address,
      doctorName,
      role: 'patient',
      isActive: true
    });

    // Send verification email
    await sendVerificationEmail(user, req);

    const token = generateAccessToken({ id: user._id, role: user.role });

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        identityNumber: user.identityNumber
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { identifier, email, password } = req.body;

    const loginEmail = identifier || email;

    if (!loginEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }


    const user = await User.findOne({ email: loginEmail });
    if (user) {
      console.log('[LOGIN] User found:', {
        email: user.email,
        isVerified: user.isVerified,
        isActive: user.isActive
      });
    } else {
      console.log('[LOGIN] No user found for email:', loginEmail);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified || !user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const accessToken = generateAccessToken({
      id: user._id,
      role: user.role
    });

    return res.json({
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}


// POST /api/auth/refresh
async function refresh(req, res) {
  res.json({ message: 'Refresh endpoint placeholder - implement token rotation.' });
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
}

// POST /api/auth/logout-all
async function logoutAll(req, res) {
  try {
    await revokeAllUserSessions(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out from all sessions' });
  } catch (err) {
    console.error('Logout-all error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/auth/sessions
async function listSessions(req, res) {
  res.json({ sessions: [] });
}

// DELETE /api/auth/sessions/:id
async function revokeSessionById(req, res) {
  res.json({ success: true });
}

// POST /api/auth/send-verification
async function sendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If the email exists, a verification link has been sent.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Account is already verified.' });
    }

    const { token, expires } = await sendVerificationEmail(user);

    user.verificationToken = token;
    user.verificationExpires = expires;
    await user.save();

    res.json({ message: 'Verification email sent successfully.' });
  } catch (err) {
    console.error('Verification send error:', err);
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
    if (user) {
      console.log('[VERIFY] User before verification:', {
        email: user.email,
        isVerified: user.isVerified
      });
    } else {
      console.log('[VERIFY] No user found for token:', token);
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Verification token is invalid or expired' });
    }
    

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    console.log('[VERIFY] User after verification:', {
      email: user.email,
      isVerified: user.isVerified
    });
    
    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }
    const { token, expires } = await sendPasswordResetEmail(user);
    user.resetToken = token;
    user.resetTokenExpire = expires; // align with common naming
    await user.save();
    res.json({ message: 'Password reset email sent successfully.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword; // ensure field matches login compare
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    user.passwordResetAttempts = [];
    await user.save();
    await revokeAllUserSessions(user._id);
    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  register,
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
