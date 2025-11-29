const AuditLog = require('../models/AuditLog');

/**
 * Log encryption/decryption events
 */
async function logAuditEvent(options) {
  try {
    const {
      action,
      userId,
      targetUserId,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status = 'success',
      details
    } = options;
    
    await AuditLog.create({
      action,
      userId,
      targetUserId,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status,
      details
    });
  } catch (err) {
    console.error('Audit logging error:', err);
    // Don't throw - audit logging shouldn't break the main flow
  }
}

/**
 * Log file access
 */
async function logFileAccess(userId, fileId, action, req, status = 'success', details = '') {
  await logAuditEvent({
    action,
    userId,
    resourceType: 'lab_report',
    resourceId: fileId,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    status,
    details
  });
}

/**
 * Log data decryption
 */
async function logDataDecryption(userId, targetUserId, resourceType, req) {
  await logAuditEvent({
    action: 'decrypt',
    userId,
    targetUserId,
    resourceType,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    status: 'success',
    details: `Decrypted ${resourceType} data`
  });
}

/**
 * Log access denial
 */
async function logAccessDenied(userId, resourceId, resourceType, req, reason) {
  await logAuditEvent({
    action: 'access_denied',
    userId,
    resourceType,
    resourceId,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    status: 'failure',
    details: reason
  });
}

module.exports = {
  logAuditEvent,
  logFileAccess,
  logDataDecryption,
  logAccessDenied
};
