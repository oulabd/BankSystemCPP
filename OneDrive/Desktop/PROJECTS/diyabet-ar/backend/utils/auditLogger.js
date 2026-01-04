/**
 * Stub for createNotification
 * Replace with actual notification logic as needed
 */
async function createNotification({ user, sender, type, message, link, meta }) {
  // For now, just log to console
  console.log('[createNotification]', { user, sender, type, message, link, meta });
  // You can implement actual notification DB logic here
}
// Notification types for use in patientController.js and other modules
const NOTIFICATION_TYPES = {
  RECORD_ADDED: 'record_added',
  RECORD_HIGH: 'record_high',
  RECORD_LOW: 'record_low',
  LAB_RESULT: 'lab_result',
  COMMENT: 'comment',
};
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
  logAccessDenied,
  NOTIFICATION_TYPES,
  createNotification
};
