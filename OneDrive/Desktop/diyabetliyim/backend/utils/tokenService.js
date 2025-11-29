const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Session = require('../models/Session');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_secure';
const ACCESS_TOKEN_EXPIRY = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 days

/**
 * Generate Access Token (short-lived)
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate Refresh Token (cryptographically random)
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Verify Access Token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Parse User Agent to get device info
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return 'Unknown Device';
  
  // Simple parsing - you can use a library like 'ua-parser-js' for better results
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return `${browser} on ${os}`;
}

/**
 * Create Session and save refresh token
 */
async function createSession(userId, userAgent, ip) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const session = await Session.create({
    user: userId,
    refreshToken,
    userAgent,
    ip,
    device: parseUserAgent(userAgent),
    expiresAt
  });
  
  return { session, refreshToken };
}

/**
 * Verify Refresh Token
 */
async function verifyRefreshToken(refreshToken) {
  const session = await Session.findOne({ refreshToken }).populate('user');
  
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await Session.findByIdAndDelete(session._id);
    return null;
  }
  
  return session;
}

/**
 * Revoke Session
 */
async function revokeSession(sessionId) {
  await Session.findByIdAndDelete(sessionId);
}

/**
 * Revoke All User Sessions
 */
async function revokeAllUserSessions(userId) {
  await Session.deleteMany({ user: userId });
}

/**
 * Get Active Sessions for User
 */
async function getActiveSessions(userId) {
  return await Session.find({ 
    user: userId,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  createSession,
  verifyRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  getActiveSessions,
  parseUserAgent
};
