const { 
  listNotifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../utils/notificationService');

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const notifications = await listNotifications(req.user.id || req.user._id, { limit: 50 });
    res.json({ notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/notifications/unread-count
async function getUnreadCount(req, res) {
  try {
    const count = await unreadCount(req.user.id || req.user._id);
    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PATCH /api/notifications/read/:id
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await markAsRead(req.user.id || req.user._id, id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    console.error('markNotificationAsRead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PATCH /api/notifications/read-all
async function markAllNotificationsAsRead(req, res) {
  try {
    await markAllAsRead(req.user.id || req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllNotificationsAsRead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/notifications/:id
async function deleteNotificationById(req, res) {
  try {
    const { id } = req.params;
    await deleteNotification(req.user.id || req.user._id, id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('deleteNotificationById error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById
};