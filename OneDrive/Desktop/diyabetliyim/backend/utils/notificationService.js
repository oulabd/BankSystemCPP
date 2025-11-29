const Notification = require('../models/Notification');

const NOTIFICATION_TYPES = {
  RECORD_HIGH: 'record_high',
  RECORD_LOW: 'record_low',
  PRESCRIPTION_NEW: 'prescription_new',
  LAB_REQUEST: 'lab_request',
  LAB_RESULT: 'lab_result',
  COMMENT: 'comment',
  MESSAGE: 'message',
  APPOINTMENT: 'appointment'
};

/**
 * Create a new notification
 * @param {Object} options - { user, sender, type, message, link, meta }
 */
async function createNotification({ user, sender, type, message, link, meta }) {
  try {
    const notification = await Notification.create({
      user,
      sender,
      type,
      message,
      link,
      meta
    });
    return notification;
  } catch (err) {
    console.error('createNotification error:', err.message);
    return null;
  }
}

/**
 * List notifications for a user
 * @param {String} userId 
 * @param {Object} options - { limit, unreadOnly }
 */
async function listNotifications(userId, options = {}) {
  const { limit = 50, unreadOnly = false } = options;
  const query = { user: userId };
  if (unreadOnly) query.read = false;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'fullName')
    .lean();

  return notifications;
}

/**
 * Get unread count for a user
 */
async function unreadCount(userId) {
  return await Notification.countDocuments({ user: userId, read: false });
}

/**
 * Mark notification as read
 */
async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
  return notification;
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
  await Notification.updateMany(
    { user: userId, read: false },
    { read: true }
  );
  return { success: true };
}

/**
 * Delete a notification
 */
async function deleteNotification(userId, notificationId) {
  await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  return { success: true };
}

module.exports = {
  createNotification,
  listNotifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  NOTIFICATION_TYPES
};
