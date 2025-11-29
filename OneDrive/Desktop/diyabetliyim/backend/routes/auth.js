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
  verifyEmail,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/send-verification', sendVerification);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/logout-all', authMiddleware, logoutAll);
router.get('/sessions', authMiddleware, listSessions);
router.delete('/sessions/:id', authMiddleware, revokeSessionById);

module.exports = router;
