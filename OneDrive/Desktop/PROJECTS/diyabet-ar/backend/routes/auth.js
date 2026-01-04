const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { passwordResetRateLimiter } = require('../middleware/rateLimiter');
const {
  login,
  refresh,
  logout,
  logoutAll,
  listSessions,
  revokeSessionById,
  sendVerification,
  verifyEmail
} = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/authController');

// المسارات العامة
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/send-verification', sendVerification);
router.get('/verify/:token', verifyEmail);

// مسارات إعادة تعيين كلمة المرور (عامة)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// المسارات المحمية
router.post('/logout-all', authMiddleware, logoutAll);
router.get('/sessions', authMiddleware, listSessions);
router.delete('/sessions/:id', authMiddleware, revokeSessionById);

module.exports = router;
